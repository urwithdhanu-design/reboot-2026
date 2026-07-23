package com.gcul.blockchain.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gcul.blockchain.model.ChainBlock;

public interface ChainBlockRepository extends JpaRepository<ChainBlock, Long> {

	Optional<ChainBlock> findTopByOrderByHeightDesc();

	List<ChainBlock> findAllByOrderByHeightAsc();
}
