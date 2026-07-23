package com.gcul.blockchain.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gcul.blockchain.model.ChainTransaction;

public interface ChainTransactionRepository extends JpaRepository<ChainTransaction, String> {

	List<ChainTransaction> findByBlockHeightIsNullOrderByCreatedAtAsc();

	List<ChainTransaction> findByBlockHeightOrderByCreatedAtAsc(long blockHeight);

	long countByBlockHeight(long blockHeight);
}
