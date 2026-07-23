package com.gcul.kyc.web;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.gcul.kyc.dto.ForgotPasswordRequest;
import com.gcul.kyc.dto.LoginRequest;
import com.gcul.kyc.dto.RegisterRequest;
import com.gcul.kyc.dto.ResetPasswordRequest;
import com.gcul.kyc.dto.UserMapper;
import com.gcul.kyc.mail.MailService;
import com.gcul.kyc.messaging.CustomerEventPublisher;
import com.gcul.kyc.model.UserAccount;
import com.gcul.kyc.security.JwtService;
import com.gcul.kyc.security.PasswordResetService;
import com.gcul.kyc.security.PasswordService;
import com.gcul.kyc.store.UserStore;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private static final Pattern MOBILE = Pattern.compile("^\\+?[0-9\\s-]{8,20}$");

	private final UserStore store;
	private final PasswordService passwords;
	private final JwtService jwt;
	private final MailService mail;
	private final PasswordResetService passwordReset;
	private final CustomerEventPublisher customerEvents;

	public AuthController(
			UserStore store,
			PasswordService passwords,
			JwtService jwt,
			MailService mail,
			PasswordResetService passwordReset,
			CustomerEventPublisher customerEvents) {
		this.store = store;
		this.passwords = passwords;
		this.jwt = jwt;
		this.mail = mail;
		this.passwordReset = passwordReset;
		this.customerEvents = customerEvents;
	}

	@PostMapping("/register")
	public Map<String, Object> register(@Valid @RequestBody RegisterRequest body) {
		if (!Boolean.TRUE.equals(body.getTermsAccepted())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Terms & Conditions must be accepted");
		}
		if (!MOBILE.matcher(body.getMobileNumber()).matches()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid mobile number");
		}
		if (store.findByEmail(body.getEmail()).isPresent()) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
		}

		UserAccount user = new UserAccount();
		user.setId(UUID.randomUUID().toString());
		user.setFullName(body.getFullName().trim());
		user.setEmail(body.getEmail().trim().toLowerCase());
		user.setMobileNumber(body.getMobileNumber().trim());
		user.setPasswordHash(passwords.hash(body.getPassword()));
		user.setTermsAccepted(true);
		user.setCreatedAt(Instant.now().toString());
		store.save(user);

		mail.sendWelcome(user.getEmail(), user.getFullName());
		customerEvents.customerRegistered(user);

		return UserMapper.authResponse(jwt.createToken(user), user);
	}

	@PostMapping("/login")
	public Map<String, Object> login(@Valid @RequestBody LoginRequest body) {
		UserAccount user = store.findByEmail(body.getIdentifier().trim())
				.or(() -> store.findByMobile(body.getIdentifier().trim()))
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
						"Invalid email/phone or password"));

		if (!passwords.matches(body.getPassword(), user.getPasswordHash())) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email/phone or password");
		}
		return UserMapper.authResponse(jwt.createToken(user), user);
	}

	@PostMapping("/admin/login")
	public Map<String, Object> adminLogin(@Valid @RequestBody LoginRequest body) {
		UserAccount user = store.findByEmail(body.getIdentifier().trim())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
						"Invalid email or password"));

		if (!passwords.matches(body.getPassword(), user.getPasswordHash())) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
		}
		if (!user.isPlatformAdmin()) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a platform admin account");
		}
		return UserMapper.authResponse(jwt.createToken(user), user);
	}

	@PostMapping("/forgot-password")
	public Map<String, Object> forgotPassword(@Valid @RequestBody ForgotPasswordRequest body) {
		return passwordReset.requestReset(body.getIdentifier());
	}

	@PostMapping("/reset-password")
	public Map<String, Object> resetPassword(@Valid @RequestBody ResetPasswordRequest body) {
		return passwordReset.resetPassword(body.getToken(), body.getNewPassword());
	}

	@GetMapping("/me")
	public Map<String, Object> me(HttpServletRequest request) {
		return UserMapper.toPublic(currentUser(request));
	}

	UserAccount currentUser(HttpServletRequest request) {
		Object attr = request.getAttribute("currentUser");
		if (attr instanceof UserAccount user) {
			return user;
		}
		throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing bearer token");
	}
}
