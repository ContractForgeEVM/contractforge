function generateNFTFunctions(features: string[]): string {
  const functions = []
  const hasReentrancy = features.includes('reentrancy') || features.includes('mint') || features.includes('auction')
  
  functions.push(`
    /**
     * @notice Mints NFTs to the caller's address with payment validation
     * @param quantity The number of NFTs to mint (must be > 0 and not exceed limits)
     * @dev Validates payment, supply limits, and per-wallet limits before minting
     * @dev Uses reentrancy protection and emits BatchMint event
     */
    function mint(uint256 quantity) external payable${hasReentrancy ? ' nonReentrant' : ''} {
        // Input validation with gas-optimized custom errors
        if (quantity == 0) revert ZeroQuantity();
        if (!publicMintEnabled) revert PublicMintDisabled();
        
        uint256 currentSupply = _tokenIdCounter;
        if (currentSupply + quantity > MAX_SUPPLY) {
            revert ExceedsMaxSupply(quantity, MAX_SUPPLY - currentSupply);
        }
        
        uint256 totalCost = MINT_PRICE * quantity;
        if (msg.value < totalCost) {
            revert InsufficientPayment(msg.value, totalCost);
        }
        
        uint256 currentMinted = _mintedPerWallet[msg.sender];
        if (currentMinted + quantity > MAX_PER_WALLET) {
            revert ExceedsWalletLimit(currentMinted + quantity, MAX_PER_WALLET);
        }
        
        ${features.includes('whitelist') ? 'if (whitelistEnabled && !_whitelist[msg.sender]) revert AddressNotWhitelisted(msg.sender);' : ''}
        ${features.includes('blacklist') ? 'if (blacklistEnabled && _blacklist[msg.sender]) revert AddressBlacklisted(msg.sender);' : ''}
        
        // Update state before external calls (CEI pattern)
        uint256 startTokenId = currentSupply + 1;
        _tokenIdCounter = currentSupply + quantity;
        _mintedPerWallet[msg.sender] = currentMinted + quantity;
        
        // Batch mint for gas efficiency
        for (uint256 i = 0; i < quantity;) {
            _safeMint(msg.sender, startTokenId + i);
            unchecked { ++i; }
        }
        
        ${features.includes('rewards') ? 'if (rewardsEnabled) userRewards[msg.sender] += rewardPerMint * quantity;' : ''}
        
        emit BatchMint(msg.sender, startTokenId, quantity);
        
        // Refund excess payment if any
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
    }`)

  functions.push(`
    /**
     * @notice Owner-only mint function for airdrops and reserved tokens
     * @param to The address to mint tokens to
     * @param quantity The number of tokens to mint
     * @dev Bypasses payment and per-wallet limits, only checks supply limit
     */
    function ownerMint(address to, uint256 quantity) external onlyOwner {
        if (to == address(0)) revert InvalidAddress();
        if (quantity == 0) revert ZeroQuantity();
        
        uint256 currentSupply = _tokenIdCounter;
        if (currentSupply + quantity > MAX_SUPPLY) {
            revert ExceedsMaxSupply(quantity, MAX_SUPPLY - currentSupply);
        }
        
        uint256 startTokenId = currentSupply + 1;
        _tokenIdCounter = currentSupply + quantity;
        
        for (uint256 i = 0; i < quantity;) {
            _safeMint(to, startTokenId + i);
            unchecked { ++i; }
        }
        
        emit BatchMint(to, startTokenId, quantity);
    }`)

  if (features.includes('whitelist')) {
    functions.push(`
    /**
     * @notice Add an address to the whitelist
     * @param account The address to add to whitelist
     * @dev Only owner can add addresses to whitelist
     */
    function addToWhitelist(address account) external onlyOwner {
        if (account == address(0)) revert InvalidAddress();
        _whitelist[account] = true;
        emit WhitelistAdded(account);
    }

    /**
     * @notice Remove an address from the whitelist
     * @param account The address to remove from whitelist
     * @dev Only owner can remove addresses from whitelist
     */
    function removeFromWhitelist(address account) external onlyOwner {
        _whitelist[account] = false;
        emit WhitelistRemoved(account);
    }

    /**
     * @notice Check if an address is whitelisted
     * @param account The address to check
     * @return bool True if address is whitelisted
     */
    function isWhitelisted(address account) external view returns (bool) {
        return _whitelist[account];
    }`)
  }

  if (features.includes('blacklist')) {
    functions.push(`
    /**
     * @notice Add an address to the blacklist
     * @param account The address to add to blacklist
     * @dev Only owner can add addresses to blacklist
     */
    function addToBlacklist(address account) external onlyOwner {
        if (account == address(0)) revert InvalidAddress();
        _blacklist[account] = true;
        emit BlacklistAdded(account);
    }

    /**
     * @notice Remove an address from the blacklist
     * @param account The address to remove from blacklist
     * @dev Only owner can remove addresses from blacklist
     */
    function removeFromBlacklist(address account) external onlyOwner {
        _blacklist[account] = false;
        emit BlacklistRemoved(account);
    }

    /**
     * @notice Check if an address is blacklisted
     * @param account The address to check
     * @return bool True if address is blacklisted
     */
    function isBlacklisted(address account) external view returns (bool) {
        return _blacklist[account];
    }`)
  }

  if (features.includes('royalties')) {
    functions.push(`
    /**
     * @notice Set the default royalty for all tokens
     * @param recipient The address to receive royalties
     * @param feeNumerator The royalty percentage in basis points (e.g., 250 = 2.5%)
     * @dev Only owner can set default royalties
     */
    function setDefaultRoyalty(address recipient, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(recipient, feeNumerator);
    }

    /**
     * @notice Set the royalty for a specific token
     * @param tokenId The token ID to set royalty for
     * @param recipient The address to receive royalties
     * @param feeNumerator The royalty percentage in basis points
     * @dev Only owner can set token-specific royalties
     */
    function setTokenRoyalty(uint256 tokenId, address recipient, uint96 feeNumerator) external onlyOwner {
        _setTokenRoyalty(tokenId, recipient, feeNumerator);
    }`)
  }

  if (features.includes('auction')) {
    functions.push(`
    /**
     * @notice Create an auction for a token
     * @param tokenId The token ID to auction
     * @param startingPrice The minimum starting bid price
     * @dev Only token owner can create auctions
     */
    function createAuction(uint256 tokenId, uint256 startingPrice) external {
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        if (auctions[tokenId].active) revert AuctionAlreadyExists();
        if (startingPrice < minimumStartingPrice) revert PriceTooLow();
        
        auctions[tokenId] = Auction({
            seller: msg.sender,
            startingPrice: startingPrice,
            endTime: block.timestamp + defaultAuctionDuration,
            highestBidder: address(0),
            highestBid: 0,
            active: true
        });
        
        emit AuctionCreated(tokenId, startingPrice, defaultAuctionDuration);
    }

    /**
     * @notice Place a bid on an active auction
     * @param tokenId The token ID being auctioned
     * @dev Must send ETH higher than current highest bid
     */
    function placeBid(uint256 tokenId) external payable {
        Auction storage auction = auctions[tokenId];
        if (!auction.active) revert NoActiveAuction();
        if (block.timestamp >= auction.endTime) revert AuctionEnded();
        if (msg.value <= auction.highestBid) revert BidTooLow();
        
        if (auction.highestBidder != address(0)) {
            payable(auction.highestBidder).transfer(auction.highestBid);
        }
        
        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value;
        
        emit BidPlaced(tokenId, msg.sender, msg.value);
    }`)
  }

  if (features.includes('staking')) {
    functions.push(`
    /**
     * @notice Stake a token to earn rewards
     * @param tokenId The token ID to stake
     * @dev Only token owner can stake their NFT
     */
    function stakeToken(uint256 tokenId) external {
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        if (stakedTokens[tokenId] != address(0)) revert TokenAlreadyStaked();
        
        stakedTokens[tokenId] = msg.sender;
        userStakedTokens[msg.sender].push(tokenId);
        
        emit TokenStaked(tokenId, msg.sender);
    }

    /**
     * @notice Unstake a token and claim rewards
     * @param tokenId The token ID to unstake
     * @dev Only the staker can unstake their token
     */
    function unstakeToken(uint256 tokenId) external {
        if (stakedTokens[tokenId] != msg.sender) revert NotTokenStaker();
        
        stakedTokens[tokenId] = address(0);
        // Remove from user's staked tokens array (simplified)
        delete userStakedTokens[msg.sender];
        
        emit TokenUnstaked(tokenId, msg.sender);
    }`)
  }

  if (features.includes('uristorage')) {
    functions.push(`
    /**
     * @notice Set the URI for a specific token
     * @param tokenId The token ID to set URI for
     * @param _tokenURI The URI to set for the token
     * @dev Only owner can set token URIs
     */
    function setTokenURI(uint256 tokenId, string memory _tokenURI) external onlyOwner {
        if (!_exists(tokenId)) revert TokenDoesNotExist();
        _setTokenURI(tokenId, _tokenURI);
    }

    /**
     * @notice Set URIs for multiple tokens in batch
     * @param tokenIds Array of token IDs
     * @param tokenURIs Array of URIs corresponding to token IDs
     * @dev Arrays must have the same length, only owner can call
     */
    function batchSetTokenURI(uint256[] calldata tokenIds, string[] calldata tokenURIs) external onlyOwner {
        if (tokenIds.length != tokenURIs.length) revert ArrayLengthMismatch();
        
        for (uint256 i = 0; i < tokenIds.length; ++i) {
            if (!_exists(tokenIds[i])) revert TokenDoesNotExist();
            _setTokenURI(tokenIds[i], tokenURIs[i]);
        }
    }`)
  }

  if (features.includes('oracle')) {
    functions.push(`
    /**
     * @notice Set the price feed oracle address
     * @param _priceFeed The address of the price feed contract
     * @dev Only owner can set price feed
     */
    function setPriceFeed(address _priceFeed) external onlyOwner {
        if (_priceFeed == address(0)) revert InvalidPriceFeedAddress();
        priceFeed = AggregatorV3Interface(_priceFeed);
        emit PriceFeedUpdated(_priceFeed);
    }

    /**
     * @notice Toggle dynamic pricing on/off
     * @dev Only owner can toggle dynamic pricing
     */
    function toggleDynamicPricing() external onlyOwner {
        useDynamicPricing = !useDynamicPricing;
        emit DynamicPricingToggled(useDynamicPricing);
    }

    /**
     * @notice Update the dynamic mint price from oracle
     * @dev Only owner can update, requires price feed to be set
     */
    function updateDynamicMintPrice() external onlyOwner {
        if (address(priceFeed) == address(0)) revert PriceFeedNotSet();
        (, int256 price,,,) = priceFeed.latestRoundData();
        if (price <= 0) revert InvalidPrice();
        dynamicMintPrice = uint256(price);
        emit DynamicPriceUpdated(dynamicMintPrice);
    }

    /**
     * @notice Get the current mint price (dynamic or fixed)
     * @return uint256 The current mint price in wei
     */
    function getCurrentPrice() external view returns (uint256) {
        if (useDynamicPricing && address(priceFeed) != address(0)) {
            return dynamicMintPrice;
        }
        return MINT_PRICE;
    }`)
  }

  // 🚀 NEW PREMIUM FEATURES IMPLEMENTATIONS

  if (features.includes('evolution')) {
    functions.push(`
    /**
     * @notice Evolve an NFT based on predefined conditions
     * @param tokenId The token ID to evolve
     * @dev Only token owner can evolve, requires meeting evolution conditions
     */
    function evolveNFT(uint256 tokenId) external {
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        if (!_exists(tokenId)) revert TokenDoesNotExist();
        
        uint256 currentLevel = tokenLevel[tokenId];
        uint256 requiredExperience = currentLevel * 100; // Example: level 1 needs 100 exp
        
        if (tokenExperience[tokenId] < requiredExperience) revert InsufficientExperience();
        
        tokenLevel[tokenId] = currentLevel + 1;
        tokenExperience[tokenId] -= requiredExperience;
        
        emit NFTEvolved(tokenId, currentLevel + 1, msg.sender);
    }

    /**
     * @notice Add experience points to a token (owner only)
     * @param tokenId The token ID to add experience to
     * @param experience The amount of experience to add
     */
    function addExperience(uint256 tokenId, uint256 experience) external onlyOwner {
        if (!_exists(tokenId)) revert TokenDoesNotExist();
        tokenExperience[tokenId] += experience;
        emit ExperienceAdded(tokenId, experience);
    }`)
  }

  if (features.includes('merging')) {
    functions.push(`
    /**
     * @notice Merge two NFTs into one with combined properties
     * @param tokenId1 The first token ID to merge
     * @param tokenId2 The second token ID to merge
     * @dev Only owner of both tokens can merge, burns both and creates new one
     */
    function mergeNFTs(uint256 tokenId1, uint256 tokenId2) external nonReentrant {
        if (ownerOf(tokenId1) != msg.sender || ownerOf(tokenId2) != msg.sender) revert NotTokenOwner();
        if (tokenId1 == tokenId2) revert CannotMergeSameToken();
        if (!_exists(tokenId1) || !_exists(tokenId2)) revert TokenDoesNotExist();
        
        // Check merge compatibility (example: same rarity)
        if (tokenRarity[tokenId1] != tokenRarity[tokenId2]) revert IncompatibleTokens();
        
        uint256 newTokenId = _tokenIdCounter + 1;
        _tokenIdCounter = newTokenId;
        
        // Combine properties
        uint256 combinedLevel = tokenLevel[tokenId1] + tokenLevel[tokenId2];
        uint256 combinedExperience = tokenExperience[tokenId1] + tokenExperience[tokenId2];
        
        // Burn original tokens
        _burn(tokenId1);
        _burn(tokenId2);
        
        // Mint new merged token
        _safeMint(msg.sender, newTokenId);
        tokenLevel[newTokenId] = combinedLevel;
        tokenExperience[newTokenId] = combinedExperience;
        tokenRarity[newTokenId] = tokenRarity[tokenId1] + 1; // Increase rarity
        
        emit NFTsMerged(tokenId1, tokenId2, newTokenId, msg.sender);
    }`)
  }

  if (features.includes('breeding')) {
    functions.push(`
    /**
     * @notice Breed two NFTs to create a new offspring
     * @param parent1 The first parent token ID
     * @param parent2 The second parent token ID
     * @dev Requires breeding fee payment and cooldown period
     */
    function breedNFTs(uint256 parent1, uint256 parent2) external payable nonReentrant {
        if (ownerOf(parent1) != msg.sender || ownerOf(parent2) != msg.sender) revert NotTokenOwner();
        if (parent1 == parent2) revert CannotBreedSameToken();
        if (!_exists(parent1) || !_exists(parent2)) revert TokenDoesNotExist();
        
        // Check breeding cost
        if (msg.value < breedingCost) revert InsufficientPayment(msg.value, breedingCost);
        
        // Check breeding cooldown
        if (block.timestamp < lastBreedTime[parent1] + breedingCooldown || 
            block.timestamp < lastBreedTime[parent2] + breedingCooldown) {
            revert BreedingCooldownActive();
        }
        
        uint256 offspringId = _tokenIdCounter + 1;
        _tokenIdCounter = offspringId;
        
        // Generate offspring traits (simplified)
        uint256 inheritedLevel = (tokenLevel[parent1] + tokenLevel[parent2]) / 2;
        uint256 inheritedRarity = (tokenRarity[parent1] + tokenRarity[parent2]) / 2;
        
        _safeMint(msg.sender, offspringId);
        tokenLevel[offspringId] = inheritedLevel;
        tokenRarity[offspringId] = inheritedRarity;
        
        // Set breeding cooldown
        lastBreedTime[parent1] = block.timestamp;
        lastBreedTime[parent2] = block.timestamp;
        
        emit NFTBred(parent1, parent2, offspringId, msg.sender);
        
        // Refund excess payment
        if (msg.value > breedingCost) {
            payable(msg.sender).transfer(msg.value - breedingCost);
        }
    }`)
  }

  if (features.includes('curation')) {
    functions.push(`
    /**
     * @notice Submit NFT for curation consideration
     * @param tokenId The token ID to submit for curation
     * @dev Token owner can submit for community/admin review
     */
    function submitForCuration(uint256 tokenId) external {
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        if (!_exists(tokenId)) revert TokenDoesNotExist();
        if (curatedTokens[tokenId]) revert AlreadyCurated();
        
        curationSubmissions[tokenId] = true;
        emit SubmittedForCuration(tokenId, msg.sender);
    }

    /**
     * @notice Approve token for curation (owner only)
     * @param tokenId The token ID to approve
     * @dev Adds token to curated collection with special status
     */
    function approveCuration(uint256 tokenId) external onlyOwner {
        if (!_exists(tokenId)) revert TokenDoesNotExist();
        if (!curationSubmissions[tokenId]) revert NotSubmittedForCuration();
        
        curatedTokens[tokenId] = true;
        curationSubmissions[tokenId] = false;
        
        emit TokenCurated(tokenId, ownerOf(tokenId));
    }

    /**
     * @notice Check if token is curated
     * @param tokenId The token ID to check
     * @return bool True if token is curated
     */
    function isCurated(uint256 tokenId) external view returns (bool) {
        return curatedTokens[tokenId];
    }`)
  }

  if (features.includes('lazyMint')) {
    functions.push(`
    /**
     * @notice Create a lazy mint voucher (off-chain signature)
     * @param to The address authorized to mint
     * @param tokenId The token ID to mint
     * @param uri The token URI
     * @param signature The owner's signature authorizing the mint
     * @dev Allows minting only when purchased, saving gas
     */
    function lazyMint(
        address to,
        uint256 tokenId,
        string calldata uri,
        bytes calldata signature
    ) external payable nonReentrant {
        if (to == address(0)) revert InvalidAddress();
        if (_exists(tokenId)) revert TokenAlreadyExists();
        if (msg.value < lazyMintPrice) revert InsufficientPayment(msg.value, lazyMintPrice);
        
        // Verify signature (simplified - in production use EIP-712)
        bytes32 hash = keccak256(abi.encodePacked(to, tokenId, uri));
        address signer = recoverSigner(hash, signature);
        if (signer != owner()) revert InvalidSignature();
        
        _safeMint(to, tokenId);
        if (bytes(uri).length > 0) {
            _setTokenURI(tokenId, uri);
        }
        
        emit LazyMinted(tokenId, to, uri);
        
        // Refund excess payment
        if (msg.value > lazyMintPrice) {
            payable(msg.sender).transfer(msg.value - lazyMintPrice);
        }
    }

    /**
     * @notice Recover signer from signature (simplified)
     * @dev In production, use OpenZeppelin's ECDSA library
     */
    function recoverSigner(bytes32 hash, bytes memory signature) internal pure returns (address) {
        // Simplified implementation - use ECDSA.recover in production
        return address(0); // Placeholder
    }`)
  }

  if (features.includes('partnership')) {
    functions.push(`
    /**
     * @notice Add a partner integration
     * @param partnerAddress The partner contract address
     * @param partnerName The name of the partner
     * @dev Only owner can add partnerships
     */
    function addPartner(address partnerAddress, string calldata partnerName) external onlyOwner {
        if (partnerAddress == address(0)) revert InvalidAddress();
        if (bytes(partnerName).length == 0) revert InvalidPartnerName();
        
        partners[partnerAddress] = Partner({
            name: partnerName,
            active: true,
            joinedAt: block.timestamp
        });
        
        emit PartnerAdded(partnerAddress, partnerName);
    }

    /**
     * @notice Execute cross-platform action with partner
     * @param partnerAddress The partner to interact with
     * @param tokenId The token ID involved
     * @param data The interaction data
     */
    function executePartnerAction(
        address partnerAddress,
        uint256 tokenId,
        bytes calldata data
    ) external {
        if (!partners[partnerAddress].active) revert PartnerNotActive();
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        
        // Execute partner interaction
        (bool success, ) = partnerAddress.call(data);
        if (!success) revert PartnerActionFailed();
        
        emit PartnerActionExecuted(partnerAddress, tokenId, msg.sender);
    }`)
  }

  if (features.includes('analytics')) {
    functions.push(`
    /**
     * @notice Record analytics event
     * @param eventType The type of event (mint, transfer, etc.)
     * @param tokenId The token ID involved (0 for general events)
     * @param value The event value (price, quantity, etc.)
     */
    function recordAnalytics(string calldata eventType, uint256 tokenId, uint256 value) external onlyOwner {
        analyticsData[eventType].push(AnalyticsEvent({
            timestamp: block.timestamp,
            tokenId: tokenId,
            value: value,
            user: msg.sender
        }));
        
        emit AnalyticsRecorded(eventType, tokenId, value, msg.sender);
    }

    /**
     * @notice Get analytics data for a specific event type
     * @param eventType The event type to query
     * @return events Array of analytics events
     */
    function getAnalytics(string calldata eventType) external view returns (AnalyticsEvent[] memory) {
        return analyticsData[eventType];
    }`)
  }

  if (features.includes('api')) {
    functions.push(`
    /**
     * @notice Execute API call with authentication
     * @param apiEndpoint The API endpoint identifier
     * @param params The call parameters
     * @param signature The authentication signature
     * @dev Allows external systems to interact via API
     */
    function executeAPICall(
        string calldata apiEndpoint,
        bytes calldata params,
        bytes calldata signature
    ) external returns (bytes memory) {
        // Verify API access signature
        bytes32 hash = keccak256(abi.encodePacked(apiEndpoint, params, msg.sender));
        address signer = recoverSigner(hash, signature);
        if (!authorizedAPIs[signer]) revert UnauthorizedAPI();
        
        // Route to appropriate function based on endpoint
        if (keccak256(bytes(apiEndpoint)) == keccak256("mint")) {
            return abi.encode(_handleAPIMint(params));
        } else if (keccak256(bytes(apiEndpoint)) == keccak256("transfer")) {
            return abi.encode(_handleAPITransfer(params));
        }
        
        revert UnsupportedAPIEndpoint();
    }

    /**
     * @notice Add authorized API caller
     * @param apiCaller The address authorized to make API calls
     */
    function authorizeAPI(address apiCaller) external onlyOwner {
        authorizedAPIs[apiCaller] = true;
        emit APIAuthorized(apiCaller);
    }`)
  }

  if (features.includes('webhook')) {
    functions.push(`
    /**
     * @notice Add webhook URL for notifications
     * @param eventType The event type to listen for
     * @param webhookUrl The URL to call
     * @dev Only owner can configure webhooks
     */
    function addWebhook(string calldata eventType, string calldata webhookUrl) external onlyOwner {
        require(bytes(webhookUrl).length > 0, "Invalid webhook URL");
        
        webhooks[eventType] = Webhook({
            url: webhookUrl,
            active: true,
            addedAt: block.timestamp
        });
        
        emit WebhookAdded(eventType, webhookUrl);
    }

    /**
     * @notice Trigger webhook notification (internal)
     * @param eventType The event that occurred
     * @param tokenId The token ID involved
     * @param data Additional event data
     */
    function _triggerWebhook(string memory eventType, uint256 tokenId, bytes memory data) internal {
        if (webhooks[eventType].active) {
            // In a real implementation, this would make an HTTP call
            // For now, we just emit an event that off-chain services can listen to
            emit WebhookTriggered(eventType, webhooks[eventType].url, tokenId, data);
        }
    }`)
  }

  if (features.includes('monitoring')) {
    functions.push(`
    /**
     * @notice Set monitoring parameters
     * @param metricType The type of metric to monitor
     * @param threshold The alert threshold
     * @param alertRecipient The address to receive alerts
     */
    function setMonitoring(
        string calldata metricType,
        uint256 threshold,
        address alertRecipient
    ) external onlyOwner {
        monitoringConfig[metricType] = MonitoringConfig({
            threshold: threshold,
            alertRecipient: alertRecipient,
            enabled: true
        });
        
        emit MonitoringConfigured(metricType, threshold, alertRecipient);
    }

    /**
     * @notice Check monitoring thresholds and trigger alerts
     * @param metricType The metric to check
     * @param currentValue The current metric value
     */
    function checkMonitoring(string calldata metricType, uint256 currentValue) external {
        MonitoringConfig memory config = monitoringConfig[metricType];
        if (config.enabled && currentValue >= config.threshold) {
            emit MonitoringAlert(metricType, currentValue, config.threshold, config.alertRecipient);
        }
    }`)
  }

  if (features.includes('backup')) {
    functions.push(`
    /**
     * @notice Create backup snapshot of contract state
     * @param backupId The unique backup identifier
     * @dev Only owner can create backups
     */
    function createBackup(string calldata backupId) external onlyOwner {
        require(bytes(backupId).length > 0, "Invalid backup ID");
        require(backups[backupId].timestamp == 0, "Backup already exists");
        
        backups[backupId] = BackupSnapshot({
            timestamp: block.timestamp,
            totalSupply: _tokenIdCounter,
            contractVersion: "1.0",
            dataHash: keccak256(abi.encodePacked(block.timestamp, _tokenIdCounter))
        });
        
        emit BackupCreated(backupId, block.timestamp);
    }

    /**
     * @notice Get backup information
     * @param backupId The backup identifier
     * @return snapshot The backup snapshot data
     */
    function getBackup(string calldata backupId) external view returns (BackupSnapshot memory) {
        return backups[backupId];
    }`)
  }

  if (features.includes('tipping')) {
    functions.push(`
    /**
     * @notice Tip the creator of a specific token
     * @param tokenId The token ID to tip for
     * @param message Optional tip message
     * @dev Sends tip to token creator with platform fee
     */
    function tipCreator(uint256 tokenId, string calldata message) external payable {
        if (!_exists(tokenId)) revert TokenDoesNotExist();
        if (msg.value == 0) revert ZeroAmount();
        
        address creator = tokenCreator[tokenId];
        if (creator == address(0)) creator = ownerOf(tokenId); // Fallback to current owner
        
        uint256 platformFee = (msg.value * tippingFeeRate) / 10000;
        uint256 creatorAmount = msg.value - platformFee;
        
        // Transfer tip to creator
        payable(creator).transfer(creatorAmount);
        
        // Transfer platform fee
        if (platformFee > 0) {
            payable(owner()).transfer(platformFee);
        }
        
        tips[tokenId].push(Tip({
            from: msg.sender,
            amount: msg.value,
            message: message,
            timestamp: block.timestamp
        }));
        
        emit CreatorTipped(tokenId, msg.sender, creator, msg.value, message);
    }

    /**
     * @notice Get tips for a specific token
     * @param tokenId The token ID to get tips for
     * @return Array of tips for the token
     */
    function getTips(uint256 tokenId) external view returns (Tip[] memory) {
        return tips[tokenId];
    }`)
  }

  if (features.includes('exclusive')) {
    functions.push(`
    /**
     * @notice Set exclusive access requirements for content
     * @param contentId The content identifier
     * @param minTokens Minimum tokens required for access
     * @param requiredTokenIds Specific token IDs required (empty array for any tokens)
     */
    function setExclusiveAccess(
        string calldata contentId,
        uint256 minTokens,
        uint256[] calldata requiredTokenIds
    ) external onlyOwner {
        exclusiveContent[contentId] = ExclusiveAccess({
            minTokensRequired: minTokens,
            requiredTokenIds: requiredTokenIds,
            active: true
        });
        
        emit ExclusiveContentSet(contentId, minTokens, requiredTokenIds);
    }

    /**
     * @notice Check if user has access to exclusive content
     * @param contentId The content identifier
     * @param user The user address to check
     * @return bool True if user has access
     */
    function hasExclusiveAccess(string calldata contentId, address user) external view returns (bool) {
        ExclusiveAccess memory access = exclusiveContent[contentId];
        if (!access.active) return false;
        
        uint256 userBalance = balanceOf(user);
        if (userBalance < access.minTokensRequired) return false;
        
        // If specific tokens required, check ownership
        if (access.requiredTokenIds.length > 0) {
            for (uint256 i = 0; i < access.requiredTokenIds.length; i++) {
                if (ownerOf(access.requiredTokenIds[i]) == user) {
                    return true;
                }
            }
            return false;
        }
        
        return true;
    }`)
  }

  if (features.includes('accounting')) {
    functions.push(`
    /**
     * @notice Record revenue transaction
     * @param transactionType The type of transaction (sale, royalty, etc.)
     * @param amount The transaction amount
     * @param recipient The recipient address
     * @param tokenId The token ID involved (0 for general transactions)
     */
    function recordRevenue(
        string calldata transactionType,
        uint256 amount,
        address recipient,
        uint256 tokenId
    ) external onlyOwner {
        revenueRecords.push(RevenueRecord({
            transactionType: transactionType,
            amount: amount,
            recipient: recipient,
            tokenId: tokenId,
            timestamp: block.timestamp
        }));
        
        // Update total revenue by type
        totalRevenue[transactionType] += amount;
        
        emit RevenueRecorded(transactionType, amount, recipient, tokenId);
    }

    /**
     * @notice Get total revenue for a transaction type
     * @param transactionType The transaction type
     * @return uint256 Total revenue amount
     */
    function getTotalRevenue(string calldata transactionType) external view returns (uint256) {
        return totalRevenue[transactionType];
    }

    /**
     * @notice Distribute revenue according to predefined rules
     * @param amount The amount to distribute
     * @dev Automatically splits revenue according to configured percentages
     */
    function distributeRevenue(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be positive");
        require(address(this).balance >= amount, "Insufficient contract balance");
        
        // Example distribution: 70% to creator, 20% to platform, 10% to development
        uint256 creatorAmount = (amount * 70) / 100;
        uint256 platformAmount = (amount * 20) / 100;
        uint256 devAmount = amount - creatorAmount - platformAmount;
        
        payable(revenueRecipients.creator).transfer(creatorAmount);
        payable(revenueRecipients.platform).transfer(platformAmount);
        payable(revenueRecipients.development).transfer(devAmount);
        
        emit RevenueDistributed(amount, creatorAmount, platformAmount, devAmount);
    }`)
  }

  return functions.join('\n')
}

function generateNFTOverrides(features: string[]): string {
  const overrides = []
  
  overrides.push(`
    /**
     * @notice Hook called before any token transfer
     * @param from The address tokens are transferred from
     * @param to The address tokens are transferred to
     * @param firstTokenId The first token ID in the batch
     * @param batchSize The number of tokens in the batch
     * @dev Prevents transfer of staked tokens and calls parent implementations
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        ${features.includes('staking') ? 'if (stakedTokens[firstTokenId] != address(0)) revert CannotTransferStakedToken();' : ''}
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
    }`)

  if (features.includes('uristorage')) {
    overrides.push(`
    /**
     * @notice Get the token URI for a given token ID
     * @param tokenId The token ID to get URI for
     * @return string The token URI
     * @dev Override required by both ERC721 and ERC721URIStorage
     */
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }`)
    

    overrides.push(`
    /**
     * @notice Internal function to burn a token
     * @param tokenId The token ID to burn
     * @dev Override required by both ERC721 and ERC721URIStorage
     */
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }`)
  }
  
  const interfaceOverrides = ['ERC721', 'ERC721Enumerable']
  if (features.includes('uristorage')) interfaceOverrides.push('ERC721URIStorage')
  if (features.includes('royalties')) interfaceOverrides.push('ERC2981')
  
  overrides.push(`
    /**
     * @notice Check if contract supports a given interface
     * @param interfaceId The interface identifier to check
     * @return bool True if interface is supported
     * @dev Override required by multiple inherited contracts
     */
    function supportsInterface(bytes4 interfaceId) public view override(${interfaceOverrides.join(', ')}) returns (bool) {
        return super.supportsInterface(interfaceId);
    }`)

  return overrides.join('\n')
}

export function generateContractCode(
  templateType: string,
  params: Record<string, any>,
  features: string[] = [],
  featureConfigs?: Record<string, any>
): string {
  switch (templateType) {
    case 'token':
      return generateTokenContract(params, features, featureConfigs)
    case 'nft':
      return generateNFTContract(params, features, featureConfigs)
    case 'dao':
      return generateDAOContract(params, features, featureConfigs)
    case 'lock':
      return generateLockContract(params, features, featureConfigs)
    case 'liquidity-pool':
        return generateLiquidityPoolContract(params, features, featureConfigs)
      case 'yield-farming':
        return generateYieldFarmingContract(params, features, featureConfigs)
      case 'gamefi-token':
        return generateGameFiTokenContract(params, features, featureConfigs)
      case 'nft-marketplace':
        return generateNFTMarketplaceContract(params, features, featureConfigs)
      case 'revenue-sharing':
        return generateRevenueSharingContract(params, features, featureConfigs)
      case 'loyalty-program':
        return generateLoyaltyProgramContract(params, features, featureConfigs)
      case 'dynamic-nft':
        return generateDynamicNFTContract(params, features, featureConfigs)
      case 'social-token':
        return generateSocialTokenContract(params, features, featureConfigs)
    default:
      throw new Error(`Unknown template type: ${templateType}`)
  }
}

function generateTokenContract(
  params: Record<string, any>, 
  features: string[], 
  featureConfigs?: any
): string {
  const name = params.name || 'MyToken'
  const symbol = params.symbol || 'MTK'
  const decimals = params.decimals || 18
  const totalSupply = params.totalSupply || '1000000'
  const contractName = name.replace(/\s+/g, '')

  const imports = ['import "@openzeppelin/contracts/token/ERC20/ERC20.sol";']
  const inheritance = ['ERC20']
  const stateVars: string[] = []
  const constructorBody: string[] = []
  const functions: string[] = []
  const customErrors: string[] = [
    '/// @notice Thrown when attempting operation with zero amount',
    'error ZeroAmount();',
    '/// @notice Thrown when transfer exceeds allowed balance', 
    'error InsufficientBalance();',
    '/// @notice Thrown when caller is not authorized',
    'error Unauthorized();',
    '/// @notice Thrown when trying to set invalid address',
    'error InvalidAddress();',
    '/// @notice Thrown when operation would exceed maximum supply',
    'error ExceedsMaxSupply();',
    '/// @notice Thrown when array lengths do not match',
    'error ArrayLengthMismatch();',
    '/// @notice Thrown when recipient address is invalid', 
    'error InvalidRecipient();',
    '/// @notice Thrown when amount is invalid',
    'error InvalidAmount();'
  ]
  const events: string[] = []
  
  // 🔥 SECURITY: Immutable variables for gas optimization
  stateVars.push('/// @notice Decimal precision for this token (immutable for gas savings)')
  stateVars.push(`uint8 private constant _DECIMALS = ${decimals};`)
  stateVars.push('')
  stateVars.push('/// @notice Initial supply minted at deployment (immutable for gas savings)')
  stateVars.push(`uint256 private immutable _INITIAL_SUPPLY = ${totalSupply} * 10 ** _DECIMALS;`)
  
  if (features.includes('pausable')) {
    imports.push('import "@openzeppelin/contracts/security/Pausable.sol";')
    inheritance.push('Pausable')
  }
  
  if (features.includes('burnable')) {
    imports.push('import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";')
    inheritance.push('ERC20Burnable')
  }
  
  if (features.includes('mintable') || features.includes('pausable') || features.includes('whitelist') || features.includes('blacklist') || features.includes('tax') || features.includes('multisig') || features.includes('airdrop')) {
    if (!inheritance.includes('Ownable')) {
      imports.push('import "@openzeppelin/contracts/access/Ownable.sol";')
      inheritance.push('Ownable')
    }
  }
  
  // 🛡️ SECURITY: Extensions supported
  const hasCapped = features.includes('capped')
  const hasPermit = features.includes('permit')
  
  if (hasCapped) {
    imports.push('import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";')
    inheritance.push('ERC20Capped')
    customErrors.push('error CapExceeded(uint256 cap, uint256 amount);')
  }
  
  if (hasPermit) {
    imports.push('import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";')
    inheritance.push('ERC20Permit')
  }
  
  if (features.includes('flashmint')) {
    imports.push('import "@openzeppelin/contracts/token/ERC20/extensions/ERC20FlashMint.sol";')
    inheritance.push('ERC20FlashMint')
  }
  
  let constructorInit = ''
  if (features.includes('capped')) {
    const maxSupply = params.maxSupply || totalSupply
    constructorInit = `ERC20("${name}", "${symbol}") ERC20Capped(${maxSupply} * 10 ** ${decimals})`
  } else {
    constructorInit = `ERC20("${name}", "${symbol}")`
  }
  
  if (features.includes('permit')) {
    constructorInit += ` ERC20Permit("${name}")`
  }
  
  if (features.includes('mintable') || features.includes('pausable') || features.includes('whitelist') || features.includes('blacklist') || features.includes('tax') || features.includes('multisig') || features.includes('airdrop')) {
    constructorInit += ' Ownable()'
  }

  constructorBody.push(`_mint(msg.sender, ${totalSupply} * 10 ** ${decimals});`)
  
  if (features.includes('whitelist')) {
    stateVars.push('/// @notice Whitelist mapping')
    stateVars.push('mapping(address => bool) private _whitelist;')
    stateVars.push('/// @notice Whether whitelist is enabled')
    stateVars.push('bool public whitelistEnabled = true;')
    customErrors.push('/// @notice Thrown when address is not whitelisted');
    customErrors.push('error AddressNotWhitelisted(address account);')
    events.push(`
    /**
     * @notice Emitted when an address is added to whitelist
     * @param account The address added
     */
    event WhitelistAdded(address indexed account);`)
    events.push(`
    /**
     * @notice Emitted when an address is removed from whitelist
     * @param account The address removed
     */
    event WhitelistRemoved(address indexed account);`)
    functions.push(generateWhitelistFunctions(features.includes('pausable')))
  }

  if (features.includes('blacklist')) {
    stateVars.push('/// @notice Blacklist mapping')
    stateVars.push('mapping(address => bool) private _blacklist;')
    stateVars.push('/// @notice Whether blacklist is enabled')
    stateVars.push('bool public blacklistEnabled = true;')
    customErrors.push('/// @notice Thrown when address is blacklisted');
    customErrors.push('error AddressBlacklisted(address account);')
    events.push(`
    /**
     * @notice Emitted when an address is added to blacklist
     * @param account The address added
     */
    event BlacklistAdded(address indexed account);`)
    events.push(`
    /**
     * @notice Emitted when an address is removed from blacklist
     * @param account The address removed
     */
    event BlacklistRemoved(address indexed account);`)
    functions.push(generateBlacklistFunctions(features.includes('pausable')))
  }

  if (features.includes('tax')) {
    stateVars.push('/// @notice Tax rate in basis points (max 2500 = 25%)')
    stateVars.push('uint256 public taxRate = 0;')
    stateVars.push('/// @notice Address to receive tax payments')
    stateVars.push('address public taxRecipient;')
    constructorBody.push('taxRecipient = msg.sender;')
    customErrors.push('error TaxRateTooHigh(uint256 maxRate);')
    events.push(`
    /**
     * @notice Emitted when tax rate is updated
     * @param newRate The new tax rate in basis points
     */
    event TaxRateUpdated(uint256 indexed newRate);`)
    functions.push(generateTaxFunctions())
  }

  if (features.includes('multisig')) {
    stateVars.push('/// @notice Array of multisig signers')
    stateVars.push('address[] public multisigSigners;')
    stateVars.push('/// @notice Number of signatures required for a transaction')
    stateVars.push('uint256 public multisigThreshold;')
    stateVars.push('/// @notice Mapping of action hash to confirmed signers')
    stateVars.push('mapping(bytes32 => mapping(address => bool)) public hasConfirmed;')
    stateVars.push('/// @notice Mapping of action hash to confirmation count')
    stateVars.push('mapping(bytes32 => uint256) public confirmations;')
    customErrors.push('error NotMultisigSigner();', 'error InvalidThreshold();')
    events.push(`
    /**
     * @notice Emitted when multisig signers are updated
     * @param signers The new array of signers
     */
    event MultisigSignersUpdated(address[] signers);`)
    
    events.push(`
    /**
     * @notice Emitted when multisig threshold is updated
     * @param threshold The new threshold value
     */
    event MultisigThresholdUpdated(uint256 indexed threshold);`)
    functions.push(generateMultisigFunctions())
  }

  if (features.includes('airdrop')) {
    functions.push(generateAirdropFunctions())
  }

  if (features.includes('pausable')) {
    functions.push(generatePausableFunctions(features.includes('whitelist') || features.includes('blacklist')))
  }

  if (features.includes('mintable')) {
    functions.push(`
    /**
     * @notice Mint new tokens to a specified address
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     * @dev Only owner can mint new tokens
     */
    function mint(address to, uint256 amount) public onlyOwner {
        if (to == address(0)) revert InvalidAddress();
        _mint(to, amount);
    }`)
  }

  // Override _mint when using ERC20Capped to resolve conflicts
  if (features.includes('capped')) {
    functions.push(`
    /**
     * @notice Internal mint function with cap check
     * @param account The account to mint to
     * @param amount The amount to mint
     * @dev Override required by ERC20Capped
     */
    function _mint(address account, uint256 amount) internal virtual override(ERC20, ERC20Capped) {
        super._mint(account, amount);
    }`)
  }

  if (params.decimals && params.decimals !== 18) {
    functions.push(`
    /**
     * @notice Get the number of decimals for this token
     * @return uint8 The number of decimals
     * @dev Override to use custom decimal places
     */
    function decimals() public pure override returns (uint8) {
        return ${params.decimals};
    }`)
  }
  
  const needsUpdateFunction = features.includes('pausable') || features.includes('whitelist') || features.includes('blacklist')
  if (needsUpdateFunction) {
    const overrideParents = ['ERC20']
    
    const checks = []
    if (features.includes('whitelist')) {
      checks.push('if (whitelistEnabled && from != address(0) && to != address(0)) {')
      checks.push('    if (!_whitelist[from]) revert AddressNotWhitelisted(from);')
      checks.push('    if (!_whitelist[to]) revert AddressNotWhitelisted(to);')
      checks.push('}')
    }
    if (features.includes('blacklist')) {
      checks.push('if (from != address(0) && to != address(0)) {')
      checks.push('    if (_blacklist[from]) revert AddressBlacklisted(from);')
      checks.push('    if (_blacklist[to]) revert AddressBlacklisted(to);')
      checks.push('}')
    }

    functions.push(`
    /**
     * @notice Hook called before any token transfer
     * @param from The address tokens are transferred from
     * @param to The address tokens are transferred to
     * @param amount The amount of tokens being transferred
     * @dev Implements whitelist/blacklist checks and pause functionality
     */
    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        virtual
        override(${overrideParents.join(', ')})${features.includes('pausable') ? '\n        whenNotPaused' : ''}
    {
        ${checks.join('\n        ')}
        super._beforeTokenTransfer(from, to, amount);
    }`)
  }

  // 🔥 SECURITY: Enhanced constructor and decimals override
  const enhancedConstructorBody = [
    '// Validate owner address',
    'if (owner == address(0)) revert InvalidAddress();',
    '// Mint initial supply to the specified owner address (factory-compatible)',
    `_mint(owner, _INITIAL_SUPPLY);`
  ]
  
  // Override decimals function to use constant
  const decimalFunction = `
    /**
     * @notice Returns the number of decimal places for this token
     * @return The number of decimals (${decimals} for this token)
     * @dev Override of ERC20 decimals() for custom precision
     * @dev Returns constant value for gas optimization
     */
    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }`
  
  // Add utility function for token info
  const tokenInfoFunction = `
    /**
     * @notice Returns comprehensive token information
     * @return tokenName The name of the token
     * @return tokenSymbol The symbol of the token  
     * @return tokenDecimals The decimal precision
     * @return tokenTotalSupply The current total supply
     * @dev View function for external integrations and UI
     */
    function tokenInfo() external view returns (
        string memory tokenName,
        string memory tokenSymbol,
        uint8 tokenDecimals,
        uint256 tokenTotalSupply
    ) {
        return (name(), symbol(), _DECIMALS, totalSupply());
    }`

  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

${imports.join('\n')}

/**
 * @title ${contractName}
 * @author Smart Contract Generator v2.0
 * @notice Advanced ERC20 token with premium security features
 * @dev Implements ERC20 standard with OpenZeppelin extensions for enhanced functionality
 * @dev Gas optimized with custom errors and efficient storage patterns
 * @custom:security-contact security@example.com
 * @custom:version 2.0.0
 */
contract ${contractName} is ${inheritance.join(', ')} {
    
    /*//////////////////////////////////////////////////////////////
                               CUSTOM ERRORS
    //////////////////////////////////////////////////////////////*/
    
    ${customErrors.join('\n    ')}

    /*//////////////////////////////////////////////////////////////
                               STATE VARIABLES
    //////////////////////////////////////////////////////////////*/
    
    ${stateVars.join('\n    ')}

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/
    
    ${events.length > 0 ? events.join('') : '// No additional events for this configuration'}

    /*//////////////////////////////////////////////////////////////
                               CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deploys the ${contractName} token contract
     * @param owner The address that will receive the initial token supply
     * @dev Mints initial supply to specified owner and initializes all extensions
     * @dev Uses immutable variables for gas optimization
     * @dev Emits Transfer event for initial mint
     */
    constructor(address owner) ${constructorInit} {
        ${enhancedConstructorBody.join('\n        ')}
        ${constructorBody.filter(line => !line.includes('_mint')).join('\n        ')}
    }

    /*//////////////////////////////////////////////////////////////
                           MAIN FUNCTIONALITY
    //////////////////////////////////////////////////////////////*/
    ${decimalFunction}${functions.join('')}

    /*//////////////////////////////////////////////////////////////
                           UTILITY FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    ${tokenInfoFunction}
}`
}

function generateWhitelistFunctions(hasPausable: boolean): string {
  return `

    /**
     * @notice Modifier to check if address is whitelisted
     * @param account The address to check
     */
    modifier onlyWhitelisted(address account) {
        if (whitelistEnabled && !_whitelist[account]) revert AddressNotWhitelisted(account);
        _;
    }

    /**
     * @notice Add an address to the whitelist
     * @param account The address to add to whitelist
     * @dev Only owner can add addresses to whitelist
     */
    function addToWhitelist(address account) public onlyOwner {
        if (account == address(0)) revert InvalidAddress();
        _whitelist[account] = true;
        emit WhitelistAdded(account);
    }

    /**
     * @notice Remove an address from the whitelist
     * @param account The address to remove from whitelist
     * @dev Only owner can remove addresses from whitelist
     */
    function removeFromWhitelist(address account) public onlyOwner {
        _whitelist[account] = false;
        emit WhitelistRemoved(account);
    }

    /**
     * @notice Add multiple addresses to whitelist in batch
     * @param accounts Array of addresses to add to whitelist
     * @dev Only owner can batch add addresses, gas optimized with ++i
     */
    function addMultipleToWhitelist(address[] memory accounts) public onlyOwner {
        uint256 length = accounts.length;
        for (uint256 i = 0; i < length; ++i) {
            if (accounts[i] == address(0)) revert InvalidAddress();
            _whitelist[accounts[i]] = true;
            emit WhitelistAdded(accounts[i]);
        }
    }

    /**
     * @notice Check if an address is whitelisted
     * @param account The address to check
     * @return bool True if address is whitelisted
     */
    function isWhitelisted(address account) public view returns (bool) {
        return _whitelist[account];
    }

    /**
     * @notice Enable whitelist functionality
     * @dev Only owner can enable whitelist
     */
    function enableWhitelist() public onlyOwner {
        whitelistEnabled = true;
        emit WhitelistEnabled();
    }

    /**
     * @notice Disable whitelist functionality
     * @dev Only owner can disable whitelist
     */
    function disableWhitelist() public onlyOwner {
        whitelistEnabled = false;
        emit WhitelistDisabled();
    }

    /**
     * @notice Emitted when whitelist is enabled
     */
    event WhitelistEnabled();
    
    /**
     * @notice Emitted when whitelist is disabled
     */
    event WhitelistDisabled();`
}

function generateBlacklistFunctions(hasPausable: boolean): string {
  return `

    /**
     * @notice Modifier to check if address is not blacklisted
     * @param account The address to check
     */
    modifier notBlacklisted(address account) {
        if (_blacklist[account]) revert AddressBlacklisted(account);
        _;
    }

    /**
     * @notice Add an address to the blacklist
     * @param account The address to add to blacklist
     * @dev Only owner can add addresses to blacklist
     */
    function addToBlacklist(address account) public onlyOwner {
        if (account == address(0)) revert InvalidAddress();
        _blacklist[account] = true;
        emit BlacklistAdded(account);
    }

    /**
     * @notice Remove an address from the blacklist
     * @param account The address to remove from blacklist
     * @dev Only owner can remove addresses from blacklist
     */
    function removeFromBlacklist(address account) public onlyOwner {
        _blacklist[account] = false;
        emit BlacklistRemoved(account);
    }

    /**
     * @notice Check if an address is blacklisted
     * @param account The address to check
     * @return bool True if address is blacklisted
     */
    function isBlacklisted(address account) public view returns (bool) {
        return _blacklist[account];
    }`
}

function generateTaxFunctions(): string {
  return `

    /**
     * @notice Set the tax rate for transfers
     * @param _taxRate The tax rate in basis points (max 2500 = 25%)
     * @dev Only owner can set tax rate, cannot exceed 25%
     */
    function setTaxRate(uint256 _taxRate) public onlyOwner {
        if (_taxRate > 2500) revert TaxRateTooHigh(2500);
        taxRate = _taxRate;
        emit TaxRateUpdated(_taxRate);
    }

    /**
     * @notice Set the tax recipient address
     * @param _taxRecipient The address to receive tax payments
     * @dev Only owner can set tax recipient, cannot be zero address
     */
    function setTaxRecipient(address _taxRecipient) public onlyOwner {
        if (_taxRecipient == address(0)) revert InvalidAddress();
        taxRecipient = _taxRecipient;
        emit TaxRecipientUpdated(_taxRecipient);
    }

    /**
     * @notice Internal transfer function with tax logic
     * @param from The address to transfer from
     * @param to The address to transfer to
     * @param amount The amount to transfer
     * @dev Applies tax if rate > 0 and valid recipient exists
     */
    function _transfer(address from, address to, uint256 amount)
        internal
        virtual
        override(ERC20)
    {
        if (taxRate > 0 && taxRecipient != address(0) && from != address(0) && to != address(0)) {
            uint256 taxAmount = (amount * taxRate) / 10000;
            uint256 transferAmount = amount - taxAmount;
            super._transfer(from, taxRecipient, taxAmount);
            super._transfer(from, to, transferAmount);
        } else {
            super._transfer(from, to, amount);
        }
    }

    /**
     * @notice Emitted when tax recipient is updated
     * @param newRecipient The new tax recipient address
     */
    event TaxRecipientUpdated(address indexed newRecipient);`
}

function generateMultisigFunctions(): string {
  return `

    /**
     * @notice Modifier to check if sender is a multisig signer
     */
    modifier onlyMultisigSigner() {
        bool isSigner = false;
        uint256 length = multisigSigners.length;
        for (uint256 i = 0; i < length; ++i) {
            if (multisigSigners[i] == msg.sender) {
                isSigner = true;
                break;
            }
        }
        if (!isSigner) revert NotMultisigSigner();
        _;
    }

    /**
     * @notice Set the multisig signers
     * @param _signers Array of signer addresses
     * @dev Only owner can set signers, at least one signer required
     */
    function setMultisigSigners(address[] memory _signers) public onlyOwner {
        if (_signers.length == 0) revert InvalidThreshold();
        multisigSigners = _signers;
        emit MultisigSignersUpdated(_signers);
    }

    /**
     * @notice Set the multisig threshold
     * @param _threshold The number of signatures required
     * @dev Only owner can set threshold, must be valid
     */
    function setMultisigThreshold(uint256 _threshold) public onlyOwner {
        if (_threshold == 0 || _threshold > multisigSigners.length) revert InvalidThreshold();
        multisigThreshold = _threshold;
        emit MultisigThresholdUpdated(_threshold);
    }

    /**
     * @notice Emitted when multisig signers are updated
     * @param signers The new array of signers
     */
    event MultisigSignersUpdated(address[] signers);
    
    /**
     * @notice Emitted when multisig threshold is updated
     * @param threshold The new threshold value
     */
    event MultisigThresholdUpdated(uint256 indexed threshold);`
}

function generateAirdropFunctions(): string {
  return `

    /**
     * @notice Perform batch airdrop to multiple recipients
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts corresponding to recipients
     * @dev Only owner can airdrop, arrays must have same length, gas optimized
     */
    function batchAirdrop(address[] memory recipients, uint256[] memory amounts) public onlyOwner {
        if (recipients.length != amounts.length) revert ArrayLengthMismatch();
        if (recipients.length == 0) revert ArrayLengthMismatch();
        
        uint256 length = recipients.length;
        for (uint256 i = 0; i < length; ++i) {
            if (recipients[i] == address(0)) revert InvalidRecipient();
            if (amounts[i] == 0) revert InvalidAmount();
            _transfer(msg.sender, recipients[i], amounts[i]);
        }
        emit BatchAirdrop(recipients, amounts);
    }

    /**
     * @notice Emitted when batch airdrop is performed
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts sent to recipients
     */
    event BatchAirdrop(address[] recipients, uint256[] amounts);`
}

function generatePausableFunctions(hasOtherBeforeTransfer: boolean): string {
  return `

    /**
     * @notice Pause all token transfers
     * @dev Only owner can pause the contract
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause all token transfers
     * @dev Only owner can unpause the contract
     */
    function unpause() public onlyOwner {
        _unpause();
    }`
}

function generateNFTContract(
  params: Record<string, any>, 
  features: string[] = [],
  premiumFeatureConfigs?: any
): string {
  const { 
    name = 'MyNFT', 
    symbol = 'MNFT', 
    maxSupply = '10000',
    baseURI = 'https://api.example.com/metadata/'
  } = params

  const contractName = name.replace(/\s+/g, '')
  const mintPrice = params.mintPrice || '0.01'
  const maxPerWallet = params.maxPerWallet || 5

  const imports = [
    'import "@openzeppelin/contracts/token/ERC721/ERC721.sol";',
    'import "@openzeppelin/contracts/access/Ownable.sol";'
  ]

  const inheritances = ['ERC721', 'Ownable']
  
  // Add conditional imports only if necessary
  if (features.includes('enumerable')) {
    imports.push('import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";')
    inheritances.push('ERC721Enumerable')
  }

  if (features.includes('uristorage')) {
    imports.push('import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";')
    inheritances.push('ERC721URIStorage')
  }

  if (features.includes('pausable')) {
    imports.push('import "@openzeppelin/contracts/security/Pausable.sol";')
    inheritances.push('Pausable')
  }

  if (features.includes('burnable')) {
    imports.push('import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";')
    inheritances.push('ERC721Burnable')
  }

  if (features.includes('royalties')) {
    imports.push('import "@openzeppelin/contracts/token/common/ERC2981.sol";')
    inheritances.push('ERC2981')
  }

  if (features.includes('permit')) {
    imports.push('import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";')
    imports.push('import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";')
    inheritances.push('EIP712')
  }

  // Add ReentrancyGuard - always needed for withdraw() function
  imports.push('import "@openzeppelin/contracts/security/ReentrancyGuard.sol";')
  inheritances.push('ReentrancyGuard')

  // Add ERC721Enumerable by default as it's used in overrides
  if (!features.includes('enumerable')) {
    imports.push('import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";')
    inheritances.push('ERC721Enumerable')
  }

  // 🔥 SECURITY: Enhanced custom errors with documentation
  const customErrors = [
    '/// @notice Thrown when attempting operation with zero quantity',
    'error ZeroQuantity();',
    '/// @notice Thrown when mint would exceed maximum supply',
    'error ExceedsMaxSupply(uint256 requested, uint256 available);',
    '/// @notice Thrown when insufficient payment provided',
    'error InsufficientPayment(uint256 provided, uint256 required);',
    '/// @notice Thrown when caller is not token owner or approved',
    'error NotAuthorized();',
    '/// @notice Thrown when trying to set invalid address',
    'error InvalidAddress();',
    '/// @notice Thrown when exceeding per-wallet mint limit',
    'error ExceedsWalletLimit(uint256 current, uint256 limit);',
    '/// @notice Thrown when public minting is disabled',
    'error PublicMintDisabled();',
    '/// @notice Thrown when token does not exist',
    'error TokenDoesNotExist();',
    '/// @notice Thrown when array lengths do not match',
    'error ArrayLengthMismatch();',
    '/// @notice Thrown when caller is not the token owner',
    'error NotTokenOwner();',
    '/// @notice Thrown when trying to transfer a staked token',
    'error CannotTransferStakedToken();',
    '/// @notice Thrown when recipient address is invalid',
    'error InvalidRecipient();',
    '/// @notice Thrown when amount is invalid',
    'error InvalidAmount();'
  ]

  // Events with proper NatSpec
  const events: string[] = []

  const stateVars = [
    '/// @notice Maximum supply of tokens that can ever be minted (immutable for gas savings)',
    `uint256 public immutable MAX_SUPPLY = ${maxSupply};`,
    '',
    '/// @notice Price per token in wei (immutable for gas savings)',
    `uint256 public immutable MINT_PRICE = ${Math.floor(parseFloat(mintPrice) * 1e18)};`,
    '',
    '/// @notice Maximum tokens allowed per wallet (immutable for gas savings)',
    `uint256 public immutable MAX_PER_WALLET = ${maxPerWallet};`,
    '',
    '/// @notice Default royalty percentage in basis points (250 = 2.5%)',
    'uint96 private constant _DEFAULT_ROYALTY_BPS = 250;',
    '',
    '/// @notice Current token ID counter for sequential minting',
    '/// @dev Starts at 0, first minted token will have ID 1',
    'uint256 private _tokenIdCounter;',
    '',
    '/// @notice Base URI for token metadata',
    '/// @dev Can be updated by owner for metadata flexibility',
    'string private _baseTokenURI;',
    '',
    '/// @notice Tracks number of tokens minted per address',
    '/// @dev Used to enforce per-wallet mint limits',
    'mapping(address => uint256) private _mintedPerWallet;',
    '',
    '/// @notice Whether public minting is currently enabled',
    'bool public publicMintEnabled = true;'
  ]

  const constructorBody = [
    `_baseTokenURI = "${baseURI}";`
  ]
  
  if (features.includes('whitelist')) {
    stateVars.push('/// @notice Whitelist mapping')
    stateVars.push('mapping(address => bool) private _whitelist;')
    stateVars.push('/// @notice Whether whitelist is enabled')
    stateVars.push('bool public whitelistEnabled = true;')
    customErrors.push('/// @notice Thrown when address is not whitelisted');
    customErrors.push('error AddressNotWhitelisted(address account);')
  }

  if (features.includes('blacklist')) {
    stateVars.push('/// @notice Blacklist mapping')
    stateVars.push('mapping(address => bool) private _blacklist;')
    stateVars.push('/// @notice Whether blacklist is enabled')
    stateVars.push('bool public blacklistEnabled = true;')
    customErrors.push('/// @notice Thrown when address is blacklisted');
    customErrors.push('error AddressBlacklisted(address account);')
  }

  if (features.includes('tax')) {
    stateVars.push('/// @notice Tax rate in basis points (max 2500 = 25%)')
    stateVars.push('uint256 public transferTaxRate = 250;')
    stateVars.push('/// @notice Address to receive tax payments')
    stateVars.push('address public taxRecipient;')
    stateVars.push('/// @notice Whether tax is enabled')
    stateVars.push('bool public taxEnabled = true;')
    constructorBody.push('taxRecipient = msg.sender;')
    customErrors.push('error TaxRateTooHigh(uint256 maxRate);')
  }

  if (features.includes('royalties')) {
    constructorBody.push('_setDefaultRoyalty(msg.sender, 250); // 2.5% royalties')
  }

  if (features.includes('auction')) {
    stateVars.push(`
    /// @notice Auction structure
    struct Auction {
        address seller;
        uint256 startingPrice;
        uint256 endTime;
        address highestBidder;
        uint256 highestBid;
        bool active;
    }
    /// @notice Mapping of token ID to auction
    mapping(uint256 => Auction) public auctions;
    /// @notice Default auction duration
    uint256 public defaultAuctionDuration = 86400; // 24 hours
    /// @notice Minimum starting price for auctions
    uint256 public minimumStartingPrice = 10000000000000000; // 0.01 ETH`)
    customErrors.push('error AuctionAlreadyExists();', 'error NoActiveAuction();', 'error AuctionEnded();', 'error BidTooLow();', 'error PriceTooLow();')
  }

  if (features.includes('oracle')) {
    stateVars.push('/// @notice Price feed oracle contract')
    stateVars.push('AggregatorV3Interface internal priceFeed;')
    stateVars.push('/// @notice Dynamic mint price from oracle')
    stateVars.push('uint256 public dynamicMintPrice;')
    stateVars.push('/// @notice Whether to use dynamic pricing')
    stateVars.push('bool public useDynamicPricing;')
    customErrors.push('error InvalidPriceFeedAddress();', 'error PriceFeedNotSet();', 'error InvalidPrice();')
  }

  if (features.includes('rewards')) {
    stateVars.push('/// @notice Mapping of user address to their accumulated rewards')
    stateVars.push('mapping(address => uint256) public userRewards;')
    stateVars.push('/// @notice Reward per mint in wei')
    stateVars.push('uint256 public rewardPerMint = 10;')
    stateVars.push('/// @notice Whether rewards are enabled')
    stateVars.push('bool public rewardsEnabled = true;')
    customErrors.push('error RewardsAlreadyAdded(address user);')
    events.push(`
    /**
     * @notice Emitted when rewards are added to a user
     * @param user The user address
     * @param amount The amount of rewards added
     */
    event RewardsAdded(address indexed user, uint256 amount);`)
  }

  if (features.includes('staking')) {
    stateVars.push('/// @notice Mapping of staked tokens to staker')
    stateVars.push('mapping(uint256 => address) public stakedTokens;')
    stateVars.push('/// @notice User staked tokens array')
    stateVars.push('mapping(address => uint256[]) public userStakedTokens;')
    stateVars.push('/// @notice Reward rate for staking')
    stateVars.push('uint256 public stakingRewardRate = 100;')
    customErrors.push('error TokenAlreadyStaked();', 'error NotTokenStaker();')
    events.push(`
    /**
     * @notice Emitted when a token is staked
     * @param tokenId The token ID staked
     * @param staker The address staking the token
     */
    event TokenStaked(uint256 indexed tokenId, address indexed staker);`)
    
    events.push(`
    /**
     * @notice Emitted when a token is unstaked
     * @param tokenId The token ID unstaked
     * @param staker The address unstaking the token
     */
    event TokenUnstaked(uint256 indexed tokenId, address indexed staker);`)
  }

  // 🚀 ADD REQUIRED STATE VARIABLES AND EVENTS FOR NEW FEATURES

  if (features.includes('evolution')) {
    stateVars.push('/// @notice Token level mapping for evolution system')
    stateVars.push('mapping(uint256 => uint256) public tokenLevel;')
    stateVars.push('/// @notice Token experience points mapping')
    stateVars.push('mapping(uint256 => uint256) public tokenExperience;')
    customErrors.push('error InsufficientExperience();')
    events.push(`
    /**
     * @notice Emitted when an NFT evolves to next level
     * @param tokenId The token that evolved
     * @param newLevel The new level achieved
     * @param owner The owner of the token
     */
    event NFTEvolved(uint256 indexed tokenId, uint256 indexed newLevel, address indexed owner);`)
    events.push(`
    /**
     * @notice Emitted when experience is added to a token
     * @param tokenId The token that gained experience
     * @param experience The amount of experience added
     */
    event ExperienceAdded(uint256 indexed tokenId, uint256 indexed experience);`)
  }

  if (features.includes('merging')) {
    stateVars.push('/// @notice Token rarity mapping for merge compatibility')
    stateVars.push('mapping(uint256 => uint256) public tokenRarity;')
    customErrors.push('error CannotMergeSameToken();', 'error IncompatibleTokens();')
    events.push(`
    /**
     * @notice Emitted when two NFTs are merged into one
     * @param token1 The first token merged
     * @param token2 The second token merged
     * @param newToken The resulting merged token
     * @param owner The owner who performed the merge
     */
    event NFTsMerged(uint256 indexed token1, uint256 indexed token2, uint256 indexed newToken, address owner);`)
  }

  if (features.includes('breeding')) {
    stateVars.push('/// @notice Breeding cost in wei')
    stateVars.push(`uint256 public breedingCost = ${Math.floor(0.01 * 1e18)}; // 0.01 ETH`)
    stateVars.push('/// @notice Breeding cooldown period in seconds')
    stateVars.push('uint256 public breedingCooldown = 86400; // 24 hours')
    stateVars.push('/// @notice Last breeding time for each token')
    stateVars.push('mapping(uint256 => uint256) public lastBreedTime;')
    customErrors.push('error CannotBreedSameToken();', 'error BreedingCooldownActive();')
    events.push(`
    /**
     * @notice Emitted when two NFTs breed to create offspring
     * @param parent1 The first parent token
     * @param parent2 The second parent token
     * @param offspring The new offspring token
     * @param owner The owner who bred the tokens
     */
    event NFTBred(uint256 indexed parent1, uint256 indexed parent2, uint256 indexed offspring, address owner);`)
  }

  if (features.includes('curation')) {
    stateVars.push('/// @notice Mapping of curated tokens')
    stateVars.push('mapping(uint256 => bool) public curatedTokens;')
    stateVars.push('/// @notice Mapping of tokens submitted for curation')
    stateVars.push('mapping(uint256 => bool) public curationSubmissions;')
    customErrors.push('error AlreadyCurated();', 'error NotSubmittedForCuration();')
    events.push(`
    /**
     * @notice Emitted when a token is submitted for curation
     * @param tokenId The token submitted
     * @param owner The token owner
     */
    event SubmittedForCuration(uint256 indexed tokenId, address indexed owner);`)
    events.push(`
    /**
     * @notice Emitted when a token is approved for curation
     * @param tokenId The curated token
     * @param owner The token owner
     */
    event TokenCurated(uint256 indexed tokenId, address indexed owner);`)
  }

  if (features.includes('lazyMint')) {
    stateVars.push('/// @notice Price for lazy minting in wei')
    stateVars.push(`uint256 public lazyMintPrice = ${Math.floor(0.001 * 1e18)}; // 0.001 ETH`)
    customErrors.push('error TokenAlreadyExists();', 'error InvalidSignature();')
    events.push(`
    /**
     * @notice Emitted when a token is lazy minted
     * @param tokenId The token that was minted
     * @param to The recipient address
     * @param uri The token URI
     */
    event LazyMinted(uint256 indexed tokenId, address indexed to, string uri);`)
  }

  if (features.includes('partnership')) {
    stateVars.push(`
    /// @notice Partner information structure
    struct Partner {
        string name;
        bool active;
        uint256 joinedAt;
    }
    /// @notice Mapping of partner addresses to partner info
    mapping(address => Partner) public partners;`)
    customErrors.push('error InvalidPartnerName();', 'error PartnerNotActive();', 'error PartnerActionFailed();')
    events.push(`
    /**
     * @notice Emitted when a new partner is added
     * @param partnerAddress The partner contract address
     * @param partnerName The partner name
     */
    event PartnerAdded(address indexed partnerAddress, string partnerName);`)
    events.push(`
    /**
     * @notice Emitted when a partner action is executed
     * @param partnerAddress The partner that executed the action
     * @param tokenId The token involved
     * @param user The user who initiated the action
     */
    event PartnerActionExecuted(address indexed partnerAddress, uint256 indexed tokenId, address indexed user);`)
  }

  if (features.includes('analytics')) {
    stateVars.push(`
    /// @notice Analytics event structure
    struct AnalyticsEvent {
        uint256 timestamp;
        uint256 tokenId;
        uint256 value;
        address user;
    }
    /// @notice Mapping of event types to analytics data
    mapping(string => AnalyticsEvent[]) public analyticsData;`)
    events.push(`
    /**
     * @notice Emitted when an analytics event is recorded
     * @param eventType The type of event
     * @param tokenId The token involved
     * @param value The event value
     * @param user The user associated with the event
     */
    event AnalyticsRecorded(string indexed eventType, uint256 indexed tokenId, uint256 value, address indexed user);`)
  }

  if (features.includes('api')) {
    stateVars.push('/// @notice Mapping of authorized API callers')
    stateVars.push('mapping(address => bool) public authorizedAPIs;')
    customErrors.push('error UnauthorizedAPI();', 'error UnsupportedAPIEndpoint();')
    events.push(`
    /**
     * @notice Emitted when an API caller is authorized
     * @param apiCaller The authorized address
     */
    event APIAuthorized(address indexed apiCaller);`)
  }

  if (features.includes('webhook')) {
    stateVars.push(`
    /// @notice Webhook configuration structure
    struct Webhook {
        string url;
        bool active;
        uint256 addedAt;
    }
    /// @notice Mapping of event types to webhook configurations
    mapping(string => Webhook) public webhooks;`)
    events.push(`
    /**
     * @notice Emitted when a webhook is added
     * @param eventType The event type
     * @param webhookUrl The webhook URL
     */
    event WebhookAdded(string indexed eventType, string webhookUrl);`)
    events.push(`
    /**
     * @notice Emitted when a webhook is triggered
     * @param eventType The event type
     * @param webhookUrl The webhook URL
     * @param tokenId The token involved
     * @param data Additional event data
     */
    event WebhookTriggered(string indexed eventType, string webhookUrl, uint256 indexed tokenId, bytes data);`)
  }

  if (features.includes('monitoring')) {
    stateVars.push(`
    /// @notice Monitoring configuration structure
    struct MonitoringConfig {
        uint256 threshold;
        address alertRecipient;
        bool enabled;
    }
    /// @notice Mapping of metric types to monitoring configurations
    mapping(string => MonitoringConfig) public monitoringConfig;`)
    events.push(`
    /**
     * @notice Emitted when monitoring is configured
     * @param metricType The metric type
     * @param threshold The alert threshold
     * @param alertRecipient The alert recipient
     */
    event MonitoringConfigured(string indexed metricType, uint256 threshold, address indexed alertRecipient);`)
    events.push(`
    /**
     * @notice Emitted when a monitoring alert is triggered
     * @param metricType The metric type
     * @param currentValue The current value
     * @param threshold The threshold that was exceeded
     * @param alertRecipient The alert recipient
     */
    event MonitoringAlert(string indexed metricType, uint256 currentValue, uint256 threshold, address indexed alertRecipient);`)
  }

  if (features.includes('backup')) {
    stateVars.push(`
    /// @notice Backup snapshot structure
    struct BackupSnapshot {
        uint256 timestamp;
        uint256 totalSupply;
        string contractVersion;
        bytes32 dataHash;
    }
    /// @notice Mapping of backup IDs to snapshots
    mapping(string => BackupSnapshot) public backups;`)
    events.push(`
    /**
     * @notice Emitted when a backup is created
     * @param backupId The backup identifier
     * @param timestamp The backup timestamp
     */
    event BackupCreated(string indexed backupId, uint256 timestamp);`)
  }

  if (features.includes('tipping')) {
    stateVars.push(`
    /// @notice Tip structure
    struct Tip {
        address from;
        uint256 amount;
        string message;
        uint256 timestamp;
    }
    /// @notice Mapping of token IDs to tips received
    mapping(uint256 => Tip[]) public tips;
    /// @notice Mapping of token IDs to their creators
    mapping(uint256 => address) public tokenCreator;
    /// @notice Tipping fee rate in basis points (default 5%)
    uint256 public tippingFeeRate = 500;`)
    events.push(`
    /**
     * @notice Emitted when a creator receives a tip
     * @param tokenId The token that was tipped for
     * @param from The tipper address
     * @param creator The creator who received the tip
     * @param amount The tip amount
     * @param message The tip message
     */
    event CreatorTipped(uint256 indexed tokenId, address indexed from, address indexed creator, uint256 amount, string message);`)
  }

  if (features.includes('exclusive')) {
    stateVars.push(`
    /// @notice Exclusive access structure
    struct ExclusiveAccess {
        uint256 minTokensRequired;
        uint256[] requiredTokenIds;
        bool active;
    }
    /// @notice Mapping of content IDs to access requirements
    mapping(string => ExclusiveAccess) public exclusiveContent;`)
    events.push(`
    /**
     * @notice Emitted when exclusive content access is set
     * @param contentId The content identifier
     * @param minTokens Minimum tokens required
     * @param requiredTokenIds Specific token IDs required
     */
    event ExclusiveContentSet(string indexed contentId, uint256 minTokens, uint256[] requiredTokenIds);`)
  }

  if (features.includes('accounting')) {
    stateVars.push(`
    /// @notice Revenue record structure
    struct RevenueRecord {
        string transactionType;
        uint256 amount;
        address recipient;
        uint256 tokenId;
        uint256 timestamp;
    }
    /// @notice Revenue recipients structure
    struct RevenueRecipients {
        address creator;
        address platform;
        address development;
    }
    /// @notice Array of all revenue records
    RevenueRecord[] public revenueRecords;
    /// @notice Mapping of transaction types to total revenue
    mapping(string => uint256) public totalRevenue;
    /// @notice Revenue distribution recipients
    RevenueRecipients public revenueRecipients;`)
    
    constructorBody.push('revenueRecipients = RevenueRecipients({creator: msg.sender, platform: owner(), development: msg.sender});')
    
    events.push(`
    /**
     * @notice Emitted when revenue is recorded
     * @param transactionType The transaction type
     * @param amount The transaction amount
     * @param recipient The recipient address
     * @param tokenId The token involved
     */
    event RevenueRecorded(string indexed transactionType, uint256 amount, address indexed recipient, uint256 indexed tokenId);`)
    events.push(`
    /**
     * @notice Emitted when revenue is distributed
     * @param totalAmount The total amount distributed
     * @param creatorAmount Amount sent to creator
     * @param platformAmount Amount sent to platform
     * @param devAmount Amount sent to development
     */
    event RevenueDistributed(uint256 totalAmount, uint256 creatorAmount, uint256 platformAmount, uint256 devAmount);`)
  }

  // Generate additional events with proper NatSpec
  if (features.includes('auction')) {
    events.push(`
    /**
     * @notice Emitted when an auction is created
     * @param tokenId The token ID being auctioned
     * @param startingPrice The starting price of the auction
     * @param duration The duration of the auction
     */
    event AuctionCreated(uint256 indexed tokenId, uint256 indexed startingPrice, uint256 duration);`)
    
    events.push(`
    /**
     * @notice Emitted when a bid is placed
     * @param tokenId The token ID being bid on
     * @param bidder The address placing the bid
     * @param amount The bid amount
     */
    event BidPlaced(uint256 indexed tokenId, address indexed bidder, uint256 indexed amount);`)
  }

  if (features.includes('oracle')) {
    events.push(`
    /**
     * @notice Emitted when price feed is updated
     * @param newPriceFeed The new price feed address
     */
    event PriceFeedUpdated(address indexed newPriceFeed);`)
    
    events.push(`
    /**
     * @notice Emitted when dynamic pricing is toggled
     * @param enabled Whether dynamic pricing is enabled
     */
    event DynamicPricingToggled(bool enabled);`)
    
    events.push(`
    /**
     * @notice Emitted when dynamic price is updated
     * @param newPrice The new dynamic price
     */
    event DynamicPriceUpdated(uint256 indexed newPrice);`)
  }



  if (features.includes('whitelist')) {
    events.push(`
    /**
     * @notice Emitted when an address is added to whitelist
     * @param account The address added
     */
    event WhitelistAdded(address indexed account);`)
    
    events.push(`
    /**
     * @notice Emitted when an address is removed from whitelist
     * @param account The address removed
     */
    event WhitelistRemoved(address indexed account);`)
  }

  if (features.includes('blacklist')) {
    events.push(`
    /**
     * @notice Emitted when an address is added to blacklist
     * @param account The address added
     */
    event BlacklistAdded(address indexed account);`)
    events.push(`
    /**
     * @notice Emitted when an address is removed from blacklist
     * @param account The address removed
     */
    event BlacklistRemoved(address indexed account);`)
  }

  const functions = generateNFTFunctions(features)

  // 🔥 SECURITY: Enhanced constructor and utility functions
  const enhancedConstructorBody = [
    `_baseTokenURI = "${baseURI.length > 32 ? 'https://api.example.com/' : baseURI}";`,
    ...(features.includes('royalties') ? [
      '// Set default royalty to contract deployer at 2.5%',
      '_setDefaultRoyalty(msg.sender, _DEFAULT_ROYALTY_BPS);'
    ] : []),
    ...constructorBody.filter(line => !line.includes('_baseTokenURI') && !line.includes('_setDefaultRoyalty'))
  ]
  
  // Add collection info utility function
  const collectionInfoFunction = `
    /**
     * @notice Returns comprehensive collection information
     * @return collectionName The name of the collection
     * @return collectionSymbol The symbol of the collection
     * @return maxSupply The maximum possible supply
     * @return currentSupply The current minted supply
     * @return mintPrice The current mint price in wei
     * @return maxPerWallet The maximum tokens per wallet
     * @dev Utility function for external integrations and UI
     */
    function collectionInfo() external view returns (
        string memory collectionName,
        string memory collectionSymbol,
        uint256 maxSupply,
        uint256 currentSupply,
        uint256 mintPrice,
        uint256 maxPerWallet
    ) {
        return (name(), symbol(), MAX_SUPPLY, _tokenIdCounter, MINT_PRICE, MAX_PER_WALLET);
    }`
  
  const totalSupplyFunction = `
    /**
     * @notice Returns the total number of tokens minted so far
     * @return The current total supply of tokens
     * @dev Gas-optimized view function, returns current counter value
     */
    function totalSupply() public view override returns (uint256) {
        return _tokenIdCounter;
    }`
  
  const mintedByWalletFunction = `
    /**
     * @notice Returns the number of tokens minted by a specific address
     * @param wallet The address to check
     * @return The number of tokens minted by the address
     * @dev Used for enforcing per-wallet mint limits
     */
    function mintedByWallet(address wallet) external view returns (uint256) {
        return _mintedPerWallet[wallet];
    }`

  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

${imports.join('\n')}

${features.includes('oracle') ? `
/**
 * @notice Interface for Chainlink price feeds
 */
interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    function description() external view returns (string memory);
    function version() external view returns (uint256);
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}
` : ''}

/**
 * @title ${contractName}
 * @author Smart Contract Generator v2.0
 * @notice Advanced ERC721 NFT collection with premium features and gas optimization
 * @dev Implements ERC721 standard with OpenZeppelin extensions for enhanced functionality
 * @dev Includes reentrancy protection, batch minting, and comprehensive access control
 * @custom:security-contact security@example.com
 * @custom:version 2.0.0
 */
contract ${contractName} is ${inheritances.join(', ')} {
    
    /*//////////////////////////////////////////////////////////////
                               CUSTOM ERRORS
    //////////////////////////////////////////////////////////////*/
    
    ${customErrors.join('\n    ')}

    /*//////////////////////////////////////////////////////////////
                              STATE VARIABLES
    //////////////////////////////////////////////////////////////*/
    
    ${stateVars.join('\n    ')}

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/
    
    ${events.length > 0 ? events.join('') : '// No additional events for this configuration'}

    /*//////////////////////////////////////////////////////////////
                               CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deploys the ${contractName} NFT collection contract
     * @dev Initializes ERC721 with name and symbol, sets initial base URI and royalties
     * @dev Uses immutable variables for gas optimization on frequently accessed values
     */
    constructor() ERC721("${name}", "${symbol}")${features.includes('permit') ? ` EIP712("${name}", "1")` : ''} Ownable() {
        ${enhancedConstructorBody.join('\n        ')}
    }

    /*//////////////////////////////////////////////////////////////
                           MINTING FUNCTIONALITY  
    //////////////////////////////////////////////////////////////*/

    ${functions}

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    ${totalSupplyFunction}
    ${mintedByWalletFunction}
    
    /**
     * @notice Returns the number of tokens still available for minting
     * @return The remaining mintable supply
     * @dev Calculated as MAX_SUPPLY - totalSupply()
     */
    function remainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - _tokenIdCounter;
    }
    ${collectionInfoFunction}

    /*//////////////////////////////////////////////////////////////
                           OWNER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Updates the base URI for token metadata (owner only)
     * @param newBaseURI The new base URI to set
     * @dev Emits BaseURIUpdated event for transparency
     */
    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        string memory previousURI = _baseTokenURI;
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(previousURI, newBaseURI, msg.sender);
    }

    /**
     * @notice Withdraws all contract funds to owner (owner only)
     * @dev Uses reentrancy protection and transfers all available balance
     * @dev Emits FundsWithdrawn event for transparency
     */
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        if (balance == 0) revert ZeroQuantity(); // Reusing error for zero balance
        
        (bool success, ) = payable(msg.sender).call{value: balance}("");
        if (!success) revert InsufficientPayment(0, balance); // Reusing error for failed transfer
        
        emit FundsWithdrawn(msg.sender, balance);
    }

    /**
     * @notice Toggle public mint status (owner only)
     * @dev Allows owner to enable/disable public minting
     */
    function togglePublicMint() external onlyOwner {
        publicMintEnabled = !publicMintEnabled;
        emit PublicMintToggled(publicMintEnabled, msg.sender);
    }

    /*//////////////////////////////////////////////////////////////
                         INTERNAL OVERRIDES
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Returns the base URI for computing tokenURI
     * @return The current base URI string
     * @dev Internal function override required by ERC721
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /*//////////////////////////////////////////////////////////////
                              EVENTS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Emitted when batch mint occurs
     * @param to The address that received the tokens
     * @param startTokenId The first token ID in the batch
     * @param quantity The number of tokens minted
     */
    event BatchMint(address indexed to, uint256 indexed startTokenId, uint256 indexed quantity);
    
    /**
     * @notice Emitted when base URI is updated
     * @param previousURI The previous base URI
     * @param newURI The new base URI
     * @param updatedBy The address that updated the URI
     */
    event BaseURIUpdated(string previousURI, string newURI, address indexed updatedBy);
    
    /**
     * @notice Emitted when contract funds are withdrawn
     * @param to The address that received the funds
     * @param amount The amount withdrawn in wei
     */
    event FundsWithdrawn(address indexed to, uint256 indexed amount);
    
    /**
     * @notice Emitted when public mint is toggled
     * @param enabled New state of public minting
     * @param toggledBy Address that toggled the state
     */
    event PublicMintToggled(bool indexed enabled, address indexed toggledBy);

    ${generateNFTOverrides(features)}
}`
}
function generateDAOContract(
  params: Record<string, any>, 
  features: string[], 
  featureConfigs?: any
): string {
  const {
    name = 'MyDAO',
    proposalThreshold = '100',
    votingPeriod = '50400'
  } = params

  const imports: string[] = [
    'import "@openzeppelin/contracts/governance/Governor.sol";',
    'import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";',
    'import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";',
    'import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";',
    'import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";'
  ]

  const inheritances: string[] = [
    'Governor',
    'GovernorSettings', 
    'GovernorCountingSimple',
    'GovernorVotes',
    'GovernorVotesQuorumFraction'
  ]

  if (features.includes('timelock')) {
    imports.push('import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";')
    inheritances.push('GovernorTimelockControl')
  }
  
  const timelockFunctions = features.includes('timelock') ? `
    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function _execute(uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        internal
        override(Governor, GovernorTimelockControl)
    {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        internal
        override(Governor, GovernorTimelockControl)
        returns (uint256)
    {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }` : ''

  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

${imports.join('\n')}

contract ${name.replace(/\s+/g, '')}DAO is ${inheritances.join(', ')} {
    constructor(IVotes _token${features.includes('timelock') ? ', TimelockController _timelock' : ''})
        Governor("${name}")
        GovernorSettings(1, ${votingPeriod}, ${proposalThreshold})
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4)
        ${features.includes('timelock') ? 'GovernorTimelockControl(_timelock)' : ''}
    {}

    function votingDelay()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber)
        public
        view
        override(IGovernor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }${timelockFunctions}
}`
}
function generateLockContract(
  params: Record<string, any>, 
  features: string[], 
  featureConfigs?: any
): string {
  const { 
    tokenAddress = '0x0000000000000000000000000000000000000000',
    beneficiary = '0x0000000000000000000000000000000000000000',
    unlockTime = 'block.timestamp + 365 days'
  } = params

  let vestingCode = ''
  if (features.includes('vesting')) {
    vestingCode = `
    struct VestingSchedule {
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 startTime;
        uint256 duration;
        uint256 slicePeriod;
    }
    
    mapping(address => VestingSchedule) public vestingSchedules;
    
    function createVestingSchedule(
        address _beneficiary,
        uint256 _amount,
        uint256 _duration,
        uint256 _slicePeriod
    ) public {
        require(msg.sender == beneficiary, "Only beneficiary can create vesting");
        require(_amount > 0, "Amount must be > 0");
        require(_duration > 0, "Duration must be > 0");
        
        vestingSchedules[_beneficiary] = VestingSchedule({
            totalAmount: _amount,
            releasedAmount: 0,
            startTime: block.timestamp,
            duration: _duration,
            slicePeriod: _slicePeriod
        });
    }
    
    function releaseVested(address _beneficiary) public {
        VestingSchedule storage schedule = vestingSchedules[_beneficiary];
        require(schedule.totalAmount > 0, "No vesting schedule");
        
        uint256 vestedAmount = computeVestedAmount(schedule);
        uint256 releasableAmount = vestedAmount - schedule.releasedAmount;
        require(releasableAmount > 0, "No tokens to release");
        
        schedule.releasedAmount += releasableAmount;
        token.transfer(_beneficiary, releasableAmount);
    }
    
    function computeVestedAmount(VestingSchedule memory schedule) private view returns (uint256) {
        uint256 currentTime = block.timestamp;
        if (currentTime < schedule.startTime) {
            return 0;
        } else if (currentTime >= schedule.startTime + schedule.duration) {
            return schedule.totalAmount;
        } else {
            uint256 timeFromStart = currentTime - schedule.startTime;
            uint256 vestedSlices = timeFromStart / schedule.slicePeriod;
            uint256 totalSlices = schedule.duration / schedule.slicePeriod;
            return (schedule.totalAmount * vestedSlices) / totalSlices;
        }
    }`
  }

  let timelockCode = ''
  if (features.includes('timelock')) {
    timelockCode = `
    uint256 public timelockDelay = 24 hours;
    mapping(bytes32 => uint256) public pendingActions;
    
    function setTimelockDelay(uint256 _delay) public {
        require(msg.sender == beneficiary, "Only beneficiary can set delay");
        timelockDelay = _delay;
    }
    
    function scheduleRelease() public {
        require(msg.sender == beneficiary, "Only beneficiary can schedule");
        bytes32 actionId = keccak256(abi.encodePacked("release"));
        pendingActions[actionId] = block.timestamp + timelockDelay;
    }
    
    function executeRelease() public {
        bytes32 actionId = keccak256(abi.encodePacked("release"));
        require(pendingActions[actionId] > 0, "No pending release");
        require(block.timestamp >= pendingActions[actionId], "Timelock not expired");
        require(block.timestamp >= unlockTime, "Tokens are still locked");
        
        delete pendingActions[actionId];
        
        uint256 amount = token.balanceOf(address(this));
        require(amount > 0, "No tokens to release");
        
        token.transfer(beneficiary, amount);
        emit TokensReleased(amount);
    }`
  }

  let multisigCode = ''
  if (features.includes('multisig')) {
    multisigCode = `
    address[] public signers;
    mapping(address => bool) public isSigner;
    uint256 public requiredSignatures;
    mapping(bytes32 => mapping(address => bool)) public hasSigned;
    mapping(bytes32 => uint256) public signatureCount;
    
    function addSigner(address _signer) public {
        require(msg.sender == beneficiary, "Only beneficiary can add signer");
        require(!isSigner[_signer], "Already a signer");
        signers.push(_signer);
        isSigner[_signer] = true;
    }
    
    function removeSigner(address _signer) public {
        require(msg.sender == beneficiary, "Only beneficiary can remove signer");
        require(isSigner[_signer], "Not a signer");
        isSigner[_signer] = false;
        for (uint i = 0; i < signers.length; i++) {
            if (signers[i] == _signer) {
                signers[i] = signers[signers.length - 1];
                signers.pop();
                break;
            }
        }
    }
    
    function setRequiredSignatures(uint256 _required) public {
        require(msg.sender == beneficiary, "Only beneficiary can set required");
        require(_required <= signers.length, "Too many required signatures");
        requiredSignatures = _required;
    }
    
    function signRelease() public {
        require(isSigner[msg.sender], "Not a signer");
        bytes32 actionId = keccak256(abi.encodePacked("release"));
        require(!hasSigned[actionId][msg.sender], "Already signed");
        
        hasSigned[actionId][msg.sender] = true;
        signatureCount[actionId]++;
        
        if (signatureCount[actionId] >= requiredSignatures) {
            require(block.timestamp >= unlockTime, "Tokens are still locked");
            
            uint256 amount = token.balanceOf(address(this));
            require(amount > 0, "No tokens to release");
            
            token.transfer(beneficiary, amount);
            emit TokensReleased(amount);
            
            // Reset signatures
            for (uint i = 0; i < signers.length; i++) {
                hasSigned[actionId][signers[i]] = false;
            }
            delete signatureCount[actionId];
        }
    }`
  }
  
  let unlockTimeValue = unlockTime
  if (unlockTime && typeof unlockTime === 'string') {
    if (unlockTime.includes('T') || /^\d{4}-\d{2}-\d{2}$/.test(unlockTime)) {
      unlockTimeValue = Math.floor(new Date(unlockTime).getTime() / 1000)
    }
    if (typeof unlockTimeValue === 'string' && !unlockTime.startsWith('block.timestamp')) {
      unlockTimeValue = `"${unlockTimeValue}"`
    }
  }

  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract TokenLock is ReentrancyGuard {
    IERC20 public immutable token;
    address public immutable beneficiary;
    uint256 public immutable unlockTime;
    
    event TokensReleased(uint256 amount);
    ${features.includes('vesting') ? 'event VestingScheduleCreated(address indexed beneficiary, uint256 amount, uint256 duration);' : ''}
    ${features.includes('vesting') ? 'event VestedTokensReleased(address indexed beneficiary, uint256 amount);' : ''}
    
    constructor() {
        token = IERC20(${tokenAddress});
        beneficiary = ${beneficiary};
        unlockTime = ${unlockTimeValue || 'block.timestamp + 365 days'};
        require(unlockTime > block.timestamp, "Unlock time must be in the future");
    }
    
    function release() public nonReentrant {
        require(block.timestamp >= unlockTime, "Tokens are still locked");
        require(msg.sender == beneficiary, "Only beneficiary can release");
        
        uint256 amount = token.balanceOf(address(this));
        require(amount > 0, "No tokens to release");
        
        token.transfer(beneficiary, amount);
        emit TokensReleased(amount);
    }
    
    function getTimeUntilUnlock() public view returns (uint256) {
        if (block.timestamp >= unlockTime) {
            return 0;
        }
        return unlockTime - block.timestamp;
    }
    
    ${vestingCode}
    ${timelockCode}
    ${multisigCode}
}`
}

function generateLiquidityPoolContract(params: Record<string, any>, features: string[], featureConfigs?: any): string {
  const { name = 'LiquidityPool', tokenA = '0x0000000000000000000000000000000000000000', tokenB = '0x0000000000000000000000000000000000000000', fee = 3000, initialPrice = 1.0 } = params
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ${name.replace(/\s+/g, '')} is ReentrancyGuard, Ownable {
    IERC20 public immutable tokenA;
    IERC20 public immutable tokenB;
    uint256 public immutable fee;
    uint256 public reserveA;
    uint256 public reserveB;
    uint256 public totalShares;
    mapping(address => uint256) public shares;
    
    event LiquidityAdded(address indexed provider, uint256 amountA, uint256 amountB, uint256 shares);
    event LiquidityRemoved(address indexed provider, uint256 amountA, uint256 amountB, uint256 shares);
    event Swap(address indexed user, address tokenIn, uint256 amountIn, uint256 amountOut);
    
    constructor(
        address _tokenA,
        address _tokenB,
        uint256 _fee
    ) Ownable() {
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
        fee = _fee;
    }
    
    function addLiquidity(uint256 amountA, uint256 amountB, uint256 minShares) external nonReentrant {
        require(amountA > 0 && amountB > 0, "Amounts must be positive");
        
        tokenA.transferFrom(msg.sender, address(this), amountA);
        tokenB.transferFrom(msg.sender, address(this), amountB);
        
        uint256 newShares;
        if (totalShares == 0) {
            newShares = sqrt(amountA * amountB);
        } else {
            newShares = min((amountA * totalShares) / reserveA, (amountB * totalShares) / reserveB);
        }
        
        require(newShares >= minShares, "Insufficient shares");
        
        reserveA += amountA;
        reserveB += amountB;
        totalShares += newShares;
        shares[msg.sender] += newShares;
        
        emit LiquidityAdded(msg.sender, amountA, amountB, newShares);
    }
    
    function removeLiquidity(uint256 sharesToRemove, uint256 minAmountA, uint256 minAmountB) external nonReentrant {
        require(sharesToRemove > 0, "Shares must be positive");
        require(shares[msg.sender] >= sharesToRemove, "Insufficient shares");
        
        uint256 amountA = (sharesToRemove * reserveA) / totalShares;
        uint256 amountB = (sharesToRemove * reserveB) / totalShares;
        
        require(amountA >= minAmountA && amountB >= minAmountB, "Insufficient output");
        
        shares[msg.sender] -= sharesToRemove;
        totalShares -= sharesToRemove;
        reserveA -= amountA;
        reserveB -= amountB;
        
        tokenA.transfer(msg.sender, amountA);
        tokenB.transfer(msg.sender, amountB);
        
        emit LiquidityRemoved(msg.sender, amountA, amountB, sharesToRemove);
    }
    
    function swap(address tokenIn, uint256 amountIn, uint256 minAmountOut) external nonReentrant {
        require(tokenIn == address(tokenA) || tokenIn == address(tokenB), "Invalid token");
        
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        
        uint256 amountOut;
        if (tokenIn == address(tokenA)) {
            amountOut = getAmountOut(amountIn, reserveA, reserveB);
            reserveA += amountIn;
            reserveB -= amountOut;
            tokenB.transfer(msg.sender, amountOut);
        } else {
            amountOut = getAmountOut(amountIn, reserveB, reserveA);
            reserveB += amountIn;
            reserveA -= amountOut;
            tokenA.transfer(msg.sender, amountOut);
        }
        
        require(amountOut >= minAmountOut, "Insufficient output");
        
        emit Swap(msg.sender, tokenIn, amountIn, amountOut);
    }
    
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) internal view returns (uint256) {
        require(amountIn > 0, "Insufficient input");
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");
        
        uint256 amountInWithFee = amountIn * (10000 - fee);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 10000) + amountInWithFee;
        return numerator / denominator;
    }
    
    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
    
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}`
}

function generateYieldFarmingContract(params: Record<string, any>, features: string[], featureConfigs?: any): string {
  const { name = 'YieldFarm', stakingToken = '0x0000000000000000000000000000000000000000', rewardToken = '0x0000000000000000000000000000000000000000', rewardRate = 0.001, duration = 30 } = params
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ${name.replace(/\s+/g, '')} is ReentrancyGuard, Ownable {
    IERC20 public immutable stakingToken;
    IERC20 public immutable rewardToken;
    uint256 public rewardRate;
    uint256 public startTime;
    uint256 public endTime;
    uint256 public totalStaked;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    
    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    
    constructor(
        address _stakingToken,
        address _rewardToken,
        uint256 _rewardRate,
        uint256 _duration
    ) Ownable() {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        rewardRate = _rewardRate;
        startTime = block.timestamp;
        endTime = block.timestamp + (_duration * 1 days);
    }
    
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot stake 0");
        require(block.timestamp < endTime, "Farming period ended");
        
        updateReward(msg.sender);
        
        stakedBalance[msg.sender] += amount;
        totalStaked += amount;
        
        stakingToken.transferFrom(msg.sender, address(this), amount);
        
        emit Staked(msg.sender, amount);
    }
    
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot withdraw 0");
        require(stakedBalance[msg.sender] >= amount, "Insufficient staked balance");
        
        updateReward(msg.sender);
        
        stakedBalance[msg.sender] -= amount;
        totalStaked -= amount;
        
        stakingToken.transfer(msg.sender, amount);
        
        emit Withdrawn(msg.sender, amount);
    }
    
    function claimReward() external nonReentrant {
        updateReward(msg.sender);
        
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardToken.transfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }
    
    function updateReward(address account) internal {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
    }
    
    function lastTimeRewardApplicable() internal view returns (uint256) {
        return block.timestamp < endTime ? block.timestamp : endTime;
    }
    
    function rewardPerToken() internal view returns (uint256) {
        if (totalStaked == 0) {
            return rewardPerTokenStored;
        }
        return rewardPerTokenStored + (
            ((lastTimeRewardApplicable() - lastUpdateTime) * rewardRate * 1e18) / totalStaked
        );
    }
    
    function earned(address account) internal view returns (uint256) {
        return (stakedBalance[account] * (rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18 + rewards[account];
    }
    
    function getRewardForDuration() external view returns (uint256) {
        return rewardRate * (endTime - startTime);
    }
}`
}

function generateGameFiTokenContract(params: Record<string, any>, features: string[], featureConfigs?: any): string {
  const { name = 'GameToken', symbol = 'GAME', maxSupply = '1000000', mintPrice = 0.01, burnRate = 2 } = params
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ${name.replace(/\s+/g, '')} is ERC20, Ownable {
    uint256 public maxSupply;
    uint256 public mintPrice;
    uint256 public burnRate;
    uint256 public totalBurned;
    
    event TokensBurned(address indexed from, uint256 amount);
    event MintPriceUpdated(uint256 newPrice);
    event BurnRateUpdated(uint256 newRate);
    
    constructor(
        uint256 _maxSupply,
        uint256 _mintPrice,
        uint256 _burnRate
    ) ERC20("${name}", "${symbol}") Ownable() {
        maxSupply = _maxSupply * 10 ** decimals();
        mintPrice = _mintPrice;
        burnRate = _burnRate;
    }
    
    function mint() external payable {
        require(msg.value >= mintPrice, "Insufficient payment");
        require(totalSupply() + 1 <= maxSupply, "Max supply reached");
        
        _mint(msg.sender, 1);
    }
    
    function _transfer(address from, address to, uint256 amount) internal virtual override {
        super._transfer(from, to, amount);
        
        if (burnRate > 0 && from != address(0) && to != address(0)) {
            uint256 burnAmount = (amount * burnRate) / 10000;
            if (burnAmount > 0) {
                _burn(to, burnAmount);
                totalBurned += burnAmount;
                emit TokensBurned(to, burnAmount);
            }
        }
    }
    
    function setMintPrice(uint256 _mintPrice) external onlyOwner {
        mintPrice = _mintPrice;
        emit MintPriceUpdated(_mintPrice);
    }
    
    function setBurnRate(uint256 _burnRate) external onlyOwner {
        require(_burnRate <= 1000, "Burn rate too high");
        burnRate = _burnRate;
        emit BurnRateUpdated(_burnRate);
    }
    
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}`
}

function generateNFTMarketplaceContract(params: Record<string, any>, features: string[], featureConfigs?: any): string {
  const { name = 'NFTMarketplace', nftContract = '0x0000000000000000000000000000000000000000', platformFee = 2.5, creatorFee = 5.0, allowMinting = false } = params
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ${name.replace(/\s+/g, '')} is ReentrancyGuard, Ownable {
    IERC721 public immutable nftContract;
    uint256 public platformFee;
    uint256 public creatorFee;
    bool public allowMinting;
    
    mapping(uint256 => uint256) public tokenPrices;
    mapping(uint256 => address) public tokenSellers;
    
    event TokenListed(uint256 indexed tokenId, uint256 price, address seller);
    event TokenSold(uint256 indexed tokenId, uint256 price, address seller, address buyer);
    event TokenDelisted(uint256 indexed tokenId, address seller);
    
    constructor(
        address _nftContract,
        uint256 _platformFee,
        uint256 _creatorFee,
        bool _allowMinting
    ) Ownable() {
        nftContract = IERC721(_nftContract);
        platformFee = _platformFee;
        creatorFee = _creatorFee;
        allowMinting = _allowMinting;
    }
    
    function listToken(uint256 tokenId, uint256 price) external {
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(nftContract.isApprovedForAll(msg.sender, address(this)), "Not approved");
        require(price > 0, "Price must be positive");
        
        tokenPrices[tokenId] = price;
        tokenSellers[tokenId] = msg.sender;
        
        emit TokenListed(tokenId, price, msg.sender);
    }
    
    function buyToken(uint256 tokenId) external payable nonReentrant {
        require(tokenPrices[tokenId] > 0, "Token not listed");
        require(msg.value >= tokenPrices[tokenId], "Insufficient payment");
        
        address seller = tokenSellers[tokenId];
        uint256 price = tokenPrices[tokenId];
        
        // Calculate fees
        uint256 platformFeeAmount = (price * platformFee) / 1000;
        uint256 creatorFeeAmount = (price * creatorFee) / 1000;
        uint256 sellerAmount = price - platformFeeAmount - creatorFeeAmount;
        
        // Transfer token
        nftContract.safeTransferFrom(seller, msg.sender, tokenId);
        
        // Transfer payments
        payable(seller).transfer(sellerAmount);
        payable(owner()).transfer(platformFeeAmount);
        
        // Clear listing
        delete tokenPrices[tokenId];
        delete tokenSellers[tokenId];
        
        emit TokenSold(tokenId, price, seller, msg.sender);
    }
    
    function delistToken(uint256 tokenId) external {
        require(tokenSellers[tokenId] == msg.sender, "Not token seller");
        
        delete tokenPrices[tokenId];
        delete tokenSellers[tokenId];
        
        emit TokenDelisted(tokenId, msg.sender);
    }
    
    function setPlatformFee(uint256 _platformFee) external onlyOwner {
        platformFee = _platformFee;
    }
    
    function setCreatorFee(uint256 _creatorFee) external onlyOwner {
        creatorFee = _creatorFee;
    }
}`
}

function generateRevenueSharingContract(params: Record<string, any>, features: string[], featureConfigs?: any): string {
  const { name = 'RevenueToken', symbol = 'REV', totalSupply = '1000000', businessWallet = '0x0000000000000000000000000000000000000000', distributionPeriod = 30 } = params
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ${name.replace(/\s+/g, '')} is ERC20, Ownable {
    address public businessWallet;
    uint256 public distributionPeriod;
    uint256 public lastDistribution;
    uint256 public totalDistributed;
    
    event RevenueDistributed(uint256 amount, uint256 timestamp);
    
    constructor(
        address _businessWallet,
        uint256 _distributionPeriod
    ) ERC20("${name}", "${symbol}") Ownable() {
        businessWallet = _businessWallet;
        distributionPeriod = _distributionPeriod;
        lastDistribution = block.timestamp;
        
        _mint(msg.sender, ${totalSupply} * 10 ** decimals());
    }
    
    function distributeRevenue() external payable {
        require(msg.sender == businessWallet, "Only business wallet can distribute");
        require(msg.value > 0, "No revenue to distribute");
        require(block.timestamp >= lastDistribution + distributionPeriod, "Distribution period not reached");
        
        uint256 totalSupply = totalSupply();
        if (totalSupply > 0) {
            for (uint256 i = 0; i < totalSupply; i++) {
                address holder = getHolderAtIndex(i);
                if (holder != address(0)) {
                    uint256 share = (balanceOf(holder) * msg.value) / totalSupply;
                    if (share > 0) {
                        payable(holder).transfer(share);
                    }
                }
            }
        }
        
        lastDistribution = block.timestamp;
        totalDistributed += msg.value;
        
        emit RevenueDistributed(msg.value, block.timestamp);
    }
    
    function getHolderAtIndex(uint256 index) internal view returns (address) {
        // Simplified implementation - in practice you'd need a more sophisticated holder tracking
        return address(0);
    }
    
    function setBusinessWallet(address _businessWallet) external onlyOwner {
        businessWallet = _businessWallet;
    }
    
    function setDistributionPeriod(uint256 _distributionPeriod) external onlyOwner {
        distributionPeriod = _distributionPeriod;
    }
}`
}

function generateLoyaltyProgramContract(params: Record<string, any>, features: string[], featureConfigs?: any): string {
  const { name = 'LoyaltyProgram', pointsPerPurchase = 10, redemptionRate = 0.01, transferable = false, expirable = true } = params
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title ${name.replace(/\s+/g, '')}
 * @dev Comprehensive loyalty program with points, tiers, and rewards
 * Generated by Smart Contract Deployer with security enhancements
 */
contract ${name.replace(/\s+/g, '')} is Ownable, ReentrancyGuard {
    string public programName;
    uint256 public pointsPerPurchase;
    uint256 public redemptionRate;
    bool public transferable;
    bool public expirable;
    
    mapping(address => uint256) public points;
    mapping(address => uint256) public lastActivity;
    
    // Events
    event PointsEarned(address indexed user, uint256 amount, uint256 total);
    event PointsRedeemed(address indexed user, uint256 amount, uint256 total);
    event PointsTransferred(address indexed from, address indexed to, uint256 amount);
    event PointsExpired(address indexed user, uint256 amount);
    
    constructor() Ownable() {
        programName = "${name}";
        pointsPerPurchase = ${pointsPerPurchase};
        redemptionRate = ${Math.floor(parseFloat(redemptionRate.toString()) * 1e18)};
        transferable = ${transferable};
        expirable = ${expirable};
    }
    
    function earnPoints(address user, uint256 purchaseAmount) external onlyOwner nonReentrant {
        require(user != address(0), "Invalid user address");
        require(purchaseAmount > 0, "Purchase amount must be positive");
        
        uint256 pointsToAdd = (purchaseAmount * pointsPerPurchase) / 100;
        
        points[user] += pointsToAdd;
        lastActivity[user] = block.timestamp;
        
        emit PointsEarned(user, pointsToAdd, points[user]);
    }
    
    function redeemPoints(uint256 amount) external nonReentrant {
        require(points[msg.sender] >= amount, "Insufficient points");
        require(amount > 0, "Amount must be positive");
        
        // Check expiration before redemption
        if (expirable && lastActivity[msg.sender] > 0) {
            uint256 daysSinceActivity = (block.timestamp - lastActivity[msg.sender]) / 1 days;
            if (daysSinceActivity > 365) {
                points[msg.sender] = 0;
                emit PointsExpired(msg.sender, points[msg.sender]);
                revert("Points have expired");
            }
        }
        
        points[msg.sender] -= amount;
        lastActivity[msg.sender] = block.timestamp;
        
        emit PointsRedeemed(msg.sender, amount, points[msg.sender]);
    }
    
    function transferPoints(address to, uint256 amount) external nonReentrant {
        require(transferable, "Points not transferable");
        require(to != address(0), "Invalid recipient");
        require(points[msg.sender] >= amount, "Insufficient points");
        require(amount > 0, "Amount must be positive");
        
        points[msg.sender] -= amount;
        points[to] += amount;
        
        emit PointsTransferred(msg.sender, to, amount);
    }
    
    function getPointsBalance(address user) external view returns (uint256) {
        if (expirable && lastActivity[user] > 0) {
            uint256 daysSinceActivity = (block.timestamp - lastActivity[user]) / 1 days;
            if (daysSinceActivity > 365) {
                return 0; // Points expired
            }
        }
        
        return points[user];
    }
    
    function getUserInfo(address user) external view returns (
        uint256 pointsBalance,
        uint256 lastActivityTime,
        bool expired
    ) {
        pointsBalance = points[user];
        lastActivityTime = lastActivity[user];
        expired = false;
        
        if (expirable && lastActivity[user] > 0) {
            uint256 daysSinceActivity = (block.timestamp - lastActivity[user]) / 1 days;
            if (daysSinceActivity > 365) {
                pointsBalance = 0;
                expired = true;
            }
        }
    }
    
    function bulkEarnPoints(address[] memory users, uint256[] memory purchaseAmounts) external onlyOwner {
        require(users.length == purchaseAmounts.length, "Arrays length mismatch");
        require(users.length <= 100, "Too many users");
        
        for (uint256 i = 0; i < users.length; i++) {
            if (users[i] != address(0) && purchaseAmounts[i] > 0) {
                uint256 pointsToAdd = (purchaseAmounts[i] * pointsPerPurchase) / 100;
                points[users[i]] += pointsToAdd;
                lastActivity[users[i]] = block.timestamp;
                emit PointsEarned(users[i], pointsToAdd, points[users[i]]);
            }
        }
    }
    
    // Admin functions
    function setPointsPerPurchase(uint256 _pointsPerPurchase) external onlyOwner {
        require(_pointsPerPurchase > 0, "Points per purchase must be positive");
        pointsPerPurchase = _pointsPerPurchase;
    }
    
    function setRedemptionRate(uint256 _redemptionRate) external onlyOwner {
        redemptionRate = _redemptionRate;
    }
    
    function setTransferable(bool _transferable) external onlyOwner {
        transferable = _transferable;
    }
    
    function setExpirable(bool _expirable) external onlyOwner {
        expirable = _expirable;
    }
    
    // Allow contract to receive ETH for rewards
    receive() external payable {}
    
    function withdraw() external onlyOwner nonReentrant {
        require(address(this).balance > 0, "No funds to withdraw");
        payable(owner()).transfer(address(this).balance);
    }
}`
}

function generateDynamicNFTContract(params: Record<string, any>, features: string[], featureConfigs?: any): string {
  const { name = 'DynamicNFT', symbol = 'DNFT', maxSupply = '10000', evolvable = true, mergeable = false } = params
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title ${name.replace(/\s+/g, '')}
 * @dev Dynamic NFT with evolution and customization features
 * Generated by Smart Contract Deployer with security enhancements
 */
contract ${name.replace(/\s+/g, '')} is ERC721, ERC721Enumerable, Ownable, ReentrancyGuard {
    
    uint256 private _tokenIdCounter;
    uint256 public constant MAX_SUPPLY = ${maxSupply};
    
    mapping(uint256 => uint256) public tokenLevel;
    mapping(uint256 => uint256) public tokenExperience;
    mapping(uint256 => string) public tokenMetadata;
    
    event TokenEvolved(uint256 indexed tokenId, uint256 newLevel, uint256 experience);
    event TokensMerged(uint256 indexed token1, uint256 indexed token2, uint256 newToken);
    
    constructor() ERC721("${name}", "${symbol}") Ownable() {}
    
    function _exists(uint256 tokenId) internal view override returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
    
    function mint(address to) external onlyOwner nonReentrant {
        require(_tokenIdCounter < MAX_SUPPLY, "Max supply reached");
        require(to != address(0), "Cannot mint to zero address");
        
        uint256 tokenId = ++_tokenIdCounter;
        
        _mint(to, tokenId);
        
        // Initialize token properties
        tokenLevel[tokenId] = 1;
        tokenExperience[tokenId] = 0;
    }
    
    function evolve(uint256 tokenId) external {
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        
        uint256 experience = tokenExperience[tokenId];
        uint256 currentLevel = tokenLevel[tokenId];
        uint256 requiredExp = currentLevel * 100;
        
        require(experience >= requiredExp, "Insufficient experience");
        
        tokenLevel[tokenId] = currentLevel + 1;
        tokenExperience[tokenId] = experience - requiredExp;
        
        emit TokenEvolved(tokenId, tokenLevel[tokenId], tokenExperience[tokenId]);
    }
    
    function addExperience(uint256 tokenId, uint256 amount) external onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        tokenExperience[tokenId] += amount;
    }
    
    function mergeTokens(uint256 token1, uint256 token2) external nonReentrant {
        require(_exists(token1) && _exists(token2), "Token does not exist");
        require(ownerOf(token1) == msg.sender && ownerOf(token2) == msg.sender, "Not token owner");
        require(token1 != token2, "Cannot merge same token");
        
        uint256 newTokenId = ++_tokenIdCounter;
        
        // Store combined properties
        uint256 combinedLevel = tokenLevel[token1] + tokenLevel[token2];
        uint256 combinedExperience = tokenExperience[token1] + tokenExperience[token2];
        
        _burn(token1);
        _burn(token2);
        _mint(msg.sender, newTokenId);
        
        // Set new token properties
        tokenLevel[newTokenId] = combinedLevel;
        tokenExperience[newTokenId] = combinedExperience;
        
        emit TokensMerged(token1, token2, newTokenId);
    }
    
    function setTokenMetadata(uint256 tokenId, string memory metadata) external onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        tokenMetadata[tokenId] = metadata;
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        
        string memory metadata = tokenMetadata[tokenId];
        if (bytes(metadata).length > 0) {
            return metadata;
        }
        
        return super.tokenURI(tokenId);
    }
    
    function totalSupply() public view override(ERC721Enumerable) returns (uint256) {
        return _tokenIdCounter;
    }
    
    // Override required by Solidity
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    )
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}`
}

function generateSocialTokenContract(params: Record<string, any>, features: string[], featureConfigs?: any): string {
  const { creatorName = 'Creator', symbol = 'SOCIAL', initialSupply = '1000000', creatorShare = 20 } = params
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ${creatorName.replace(/\s+/g, '')}Token is ERC20, Ownable {
    address public creator;
    uint256 public creatorShare;
    uint256 public totalTips;
    
    mapping(address => uint256) public creatorTips;
    uint256 public tipFee;
    
    event TipReceived(address indexed from, uint256 amount, string message);
    event CreatorShareWithdrawn(uint256 amount);
    
    constructor(
        address _creator,
        uint256 _creatorShare
    ) ERC20("${creatorName} Token", "${symbol}") Ownable() {
        creator = _creator;
        creatorShare = _creatorShare;
        tipFee = 0.001 ether;
        
        // Mint initial supply to creator
        uint256 creatorAmount = (${initialSupply} * 10 ** decimals() * _creatorShare) / 100;
        _mint(creator, creatorAmount);
        
        // Mint remaining to deployer for distribution
        _mint(msg.sender, ${initialSupply} * 10 ** decimals() - creatorAmount);
    }
    
    function tipCreator(string memory message) external payable {
        require(msg.value > 0, "Tip amount must be positive");
        require(msg.value >= tipFee, "Tip amount below minimum");
        
        uint256 tipAmount = msg.value - tipFee;
        creatorTips[creator] += tipAmount;
        totalTips += tipAmount;
        
        payable(creator).transfer(tipAmount);
        
        emit TipReceived(msg.sender, tipAmount, message);
    }
    
    function withdrawCreatorShare() external {
        require(msg.sender == creator, "Only creator can withdraw");
        
        uint256 balance = balanceOf(creator);
        require(balance > 0, "No tokens to withdraw");
        
        _transfer(creator, msg.sender, balance);
        
        emit CreatorShareWithdrawn(balance);
    }
    
    function setTipFee(uint256 fee) external onlyOwner {
        tipFee = fee;
    }
    
    function getCreatorTips() external view returns (uint256) {
        return creatorTips[creator];
    }
}`
}