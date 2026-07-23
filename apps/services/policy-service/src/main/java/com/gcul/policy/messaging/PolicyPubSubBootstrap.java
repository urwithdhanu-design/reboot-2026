package com.gcul.policy.messaging;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import com.gcul.messaging.EventTopics;
import com.gcul.messaging.GculEventSubscriber;
import com.gcul.messaging.GculEventSubscriberGroup;
import com.gcul.messaging.PubSubNames;
import com.gcul.messaging.spring.GculPubSubProperties;

@Component
public class PolicyPubSubBootstrap implements ApplicationRunner, AutoCloseable {

	private final GculPubSubProperties properties;
	private final PolicyEventHandlers handlers;
	private final GculEventSubscriberGroup group = new GculEventSubscriberGroup();

	public PolicyPubSubBootstrap(GculPubSubProperties properties, PolicyEventHandlers handlers) {
		this.properties = properties;
		this.handlers = handlers;
	}

	@Override
	public void run(ApplicationArguments args) throws Exception {
		startSub(EventTopics.PAYMENT, handlers::handlePayment);
		startSub(EventTopics.BLOCKCHAIN, handlers::handleBlockchain);
		startSub(EventTopics.WALLET, handlers::handleWallet);
	}

	private void startSub(String topicSuffix, com.gcul.messaging.DomainEventHandler handler) throws Exception {
		GculEventSubscriber subscriber = new GculEventSubscriber(properties.isEnabled(), properties.getProjectId());
		String subId = PubSubNames.subscriptionId(
				properties.getTopicPrefix(), topicSuffix, properties.getServiceId());
		subscriber.start(subId, properties.getServiceId(), java.util.List.of(handler));
		group.add(subscriber);
	}

	@Override
	public void close() throws Exception {
		group.close();
	}
}
