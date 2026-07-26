package com.gcul.claims.messaging;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.gcul.claims.model.InsuranceClaim;
import com.gcul.messaging.EventTopics;
import com.gcul.messaging.GculEventPublisher;

@Component
public class ClaimEventPublisher {

	private final GculEventPublisher publisher;

	public ClaimEventPublisher(GculEventPublisher publisher) {
		this.publisher = publisher;
	}

	public void claimSubmitted(InsuranceClaim claim) {
		publish(claim, "ClaimSubmitted");
		publishLegacy(claim, "ClaimRequested");
	}

	public void claimInitiated(InsuranceClaim claim) {
		publish(claim, "ClaimInitiated");
	}

	public void claimValidated(InsuranceClaim claim) {
		publish(claim, "ClaimValidated");
	}

	public void claimPendingApproval(InsuranceClaim claim) {
		publish(claim, "ClaimPendingApproval");
	}

	public void claimInReview(InsuranceClaim claim) {
		publish(claim, "ClaimInReview");
	}

	public void claimApproved(InsuranceClaim claim) {
		publish(claim, "ClaimApproved");
	}

	public void claimPaymentPending(InsuranceClaim claim) {
		publish(claim, "ClaimPaymentPending");
	}

	public void claimPaidOut(InsuranceClaim claim) {
		publish(claim, "ClaimPaidOut");
		publishPayment(claim);
	}

	public void claimSettled(InsuranceClaim claim) {
		publish(claim, "ClaimSettled");
	}

	public void claimRejected(InsuranceClaim claim) {
		publish(claim, "ClaimRejected");
	}

	private void publish(InsuranceClaim claim, String eventType) {
		Map<String, Object> payload = base(claim);
		payload.put("eventType", eventType);
		publisher.publish(EventTopics.CLAIM, payload);
	}

	private void publishLegacy(InsuranceClaim claim, String eventType) {
		Map<String, Object> payload = base(claim);
		payload.put("eventType", eventType);
		publisher.publish(EventTopics.CLAIM, payload);
	}

	private void publishPayment(InsuranceClaim claim) {
		Map<String, Object> payload = base(claim);
		payload.put("eventType", "ClaimPaid");
		payload.put("amountPaid", payoutAmount(claim));
		publisher.publish(EventTopics.PAYMENT, payload);
	}

	private static Map<String, Object> base(InsuranceClaim claim) {
		Map<String, Object> payload = new LinkedHashMap<>();
		payload.put("claimId", claim.getId());
		payload.put("policyRef", claim.getPolicyRef());
		payload.put("policyReferenceHash", claim.getPolicyReferenceHash());
		payload.put("customerId", claim.getCustomerId());
		payload.put("customerName", claim.getCustomerName());
		payload.put("customerEmail", claim.getCustomerEmail());
		payload.put("amountClaimed", claim.getAmountClaimed());
		payload.put("approvedAmount", payoutAmount(claim));
		payload.put("status", claim.getStatus());
		payload.put("cantonContractId", claim.getCantonContractId());
		payload.put("payoutTransactionId", claim.getPayoutTransactionId());
		payload.put("settlementTransactionId", claim.getSettlementTransactionId());
		return payload;
	}

	private static double payoutAmount(InsuranceClaim claim) {
		return claim.getApprovedAmount() == null ? claim.getAmountClaimed() : claim.getApprovedAmount();
	}
}
