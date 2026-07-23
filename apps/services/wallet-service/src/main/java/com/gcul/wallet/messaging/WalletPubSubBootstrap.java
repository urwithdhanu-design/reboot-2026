package com.gcul.wallet.messaging;

import java.util.List;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import com.gcul.messaging.EventTopics;
import com.gcul.messaging.GculEventSubscriber;
import com.gcul.messaging.GculEventSubscriberGroup;
import com.gcul.messaging.PubSubNames;
import com.gcul.messaging.spring.GculPubSubProperties;

@Component
public class WalletPubSubBootstrap implements ApplicationRunner, AutoCloseable {

	private final GculPubSubProperties properties;
	private final CustomerVerifiedHandler customerVerifiedHandler;
	private final GculEventSubscriberGroup group = new GculEventSubscriberGroup();

	public WalletPubSubBootstrap(GculPubSubProperties properties, CustomerVerifiedHandler customerVerifiedHandler) {
		this.properties = properties;
		this.customerVerifiedHandler = customerVerifiedHandler;
	}

	@Override
	public void run(ApplicationArguments args) throws Exception {
		GculEventSubscriber subscriber = new GculEventSubscriber(properties.isEnabled(), properties.getProjectId());
		String subId = PubSubNames.subscriptionId(
				properties.getTopicPrefix(), EventTopics.CUSTOMER, properties.getServiceId());
		subscriber.start(subId, properties.getServiceId(), List.of(customerVerifiedHandler::handle));
		group.add(subscriber);
	}

	@Override
	public void close() throws Exception {
		group.close();
	}
}
