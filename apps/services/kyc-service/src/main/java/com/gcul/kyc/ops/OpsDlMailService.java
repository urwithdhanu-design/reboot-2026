package com.gcul.kyc.ops;

import org.springframework.stereotype.Service;

import com.gcul.kyc.mail.MailService;
import com.gcul.kyc.model.UserAccount;

@Service
public class OpsDlMailService {

	private final MailService mail;
	private final OpsDlProperties ops;

	public OpsDlMailService(MailService mail, OpsDlProperties ops) {
		this.mail = mail;
		this.ops = ops;
	}

	public void customerRegistered(UserAccount user) {
		String body = """
				<h2>New customer registered</h2>
				<p><strong>Name:</strong> %s</p>
				<p><strong>Email:</strong> %s</p>
				<p><strong>Customer ID:</strong> %s</p>
				<p><strong>Mobile:</strong> %s</p>
				<p><em>Also published to Pub/Sub topic <code>gcul.customer-events</code> (CustomerRegistered).</em></p>
				""".formatted(
				escape(user.getFullName()),
				escape(user.getEmail()),
				escape(user.getId()),
				escape(user.getMobileNumber()));
		for (String to : ops.recipients()) {
			mail.send(to, "New customer registered", body);
		}
	}

	private static String escape(String value) {
		if (value == null) {
			return "";
		}
		return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
	}
}
