package com.gcul.blockchain.messaging;

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
public class BlockchainPubSubBootstrap implements ApplicationRunner, AutoCloseable {

	private final GculPubSubProperties properties;
	private final PolicyMintService policyMintService;
	private final GculEventSubscriberGroup group = new GculEventSubscriberGroup();

	public BlockchainPubSubBootstrap(GculPubSubProperties properties, PolicyMintService policyMintService) {
		this.properties = properties;
		this.policyMintService = policyMintService;
	}

	@Override
	public void run(ApplicationArguments args) throws Exception {
		GculEventSubscriber subscriber = new GculEventSubscriber(properties.isEnabled(), properties.getProjectId());
		String subId = PubSubNames.subscriptionId(
				properties.getTopicPrefix(), EventTopics.POLICY, properties.getServiceId());
		subscriber.start(subId, properties.getServiceId(), List.of(policyMintService::handle));
		group.add(subscriber);
	}

	@Override
	public void close() throws Exception {
		group.close();
	}
}
