package com.gcul.messaging;

public final class PubSubNames {

	private PubSubNames() {
	}

	public static String topicId(String prefix, String suffix) {
		return prefix + "." + suffix;
	}

	/** Matches deploy/setup-pubsub.ps1: ($topicId + "--" + $subSvc) with dots → dashes */
	public static String subscriptionId(String prefix, String suffix, String serviceId) {
		return (topicId(prefix, suffix) + "--" + serviceId).replace('.', '-');
	}
}
