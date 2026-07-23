package com.gcul.messaging;

import java.util.ArrayList;
import java.util.List;

public final class GculEventSubscriberGroup implements AutoCloseable {

	private final List<GculEventSubscriber> subscribers = new ArrayList<>();

	public void add(GculEventSubscriber subscriber) {
		subscribers.add(subscriber);
	}

	@Override
	public void close() throws Exception {
		for (GculEventSubscriber sub : subscribers) {
			sub.close();
		}
	}
}
