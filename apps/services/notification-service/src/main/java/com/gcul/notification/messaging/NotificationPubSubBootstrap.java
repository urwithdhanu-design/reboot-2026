package com.gcul.notification.messaging;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import com.gcul.messaging.EventTopics;
import com.gcul.messaging.GculEventSubscriber;
import com.gcul.messaging.GculEventSubscriberGroup;
import com.gcul.messaging.PubSubNames;
import com.gcul.messaging.spring.GculPubSubProperties;

@Component
public class NotificationPubSubBootstrap implements ApplicationRunner, AutoCloseable {

	private final GculPubSubProperties properties;
	private final DomainEventNotificationHandler handler;
	private final GculEventSubscriberGroup group = new GculEventSubscriberGroup();

	public NotificationPubSubBootstrap(
			GculPubSubProperties properties,
			DomainEventNotificationHandler handler) {
		this.properties = properties;
		this.handler = handler;
	}

	@Override
	public void run(ApplicationArguments args) throws Exception {
		for (String topic : new String[] {
				EventTopics.CUSTOMER,
				EventTopics.WALLET,
				EventTopics.PAYMENT,
				EventTopics.POLICY,
				EventTopics.BLOCKCHAIN,
				EventTopics.CLAIM
		}) {
			GculEventSubscriber subscriber = new GculEventSubscriber(properties.isEnabled(), properties.getProjectId());
			String subId = PubSubNames.subscriptionId(
					properties.getTopicPrefix(), topic, properties.getServiceId());
			subscriber.start(subId, properties.getServiceId(), java.util.List.of(handler::handle));
			group.add(subscriber);
		}
	}

	@Override
	public void close() throws Exception {
		group.close();
	}
}
