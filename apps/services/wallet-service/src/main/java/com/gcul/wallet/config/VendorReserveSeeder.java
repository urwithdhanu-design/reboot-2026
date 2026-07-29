package com.gcul.wallet.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import com.gcul.wallet.service.VendorReserveService;

@Component
public class VendorReserveSeeder implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(VendorReserveSeeder.class);

	private final VendorReserveService vendorReserve;

	public VendorReserveSeeder(VendorReserveService vendorReserve) {
		this.vendorReserve = vendorReserve;
	}

	@Override
	public void run(ApplicationArguments args) {
		vendorReserve.ensureVendorReserve("vitality", "Vitality");
		vendorReserve.ensureVendorReserve("homeshield", "HomeShield");
		log.info("Ensured demo vendor reserve wallets (vitality, homeshield)");
	}
}
