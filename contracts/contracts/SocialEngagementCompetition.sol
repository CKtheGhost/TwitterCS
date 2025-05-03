// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/**
 * @title SocialEngagementCompetition
 * @dev A smart contract for managing seasonal competitions on a social engagement platform
 * Features:
 * - Entry fee with platform commission
 * - Season-based competitions
 * - Quest system with daily limits
 * - Bot detection and penalty system
 * - Prize distribution for top performers
 */
contract SocialEngagementCompetition is ReentrancyGuard, Ownable, Pausable {
    using Address for address payable;

    // ========== CONSTANTS ==========

    // Entry fee is 0.1 ETH
    uint256 public constant ENTRY_FEE = 0.1 ether;
    
    // Platform commission is 3%
    uint256 public constant PLATFORM_COMMISSION_PERCENT = 3;
    
    // Season duration is 7 days (in seconds)
    uint256 public constant SEASON_DURATION = 7 days;
    
    // Maximum number of quests allowed per day
    uint256 public constant MAX_DAILY_QUESTS = 30;
    
    // Time window for unusual activity detection (in seconds)
    uint256 public constant SUSPICIOUS_TIME_WINDOW = 10 minutes;
    
    // Maximum quest completions within suspicious time window
    uint256 public constant SUSPICIOUS_ACTIVITY_THRESHOLD = 15;
    
    // Prize claim window after season ends (30 days)
    uint256 public constant PRIZE_CLAIM_WINDOW = 30 days;

    // ========== ENUMS ==========

    // Season states
    enum SeasonState {
        Registration,
        Active,
        Finished,
        Distributed
    }

    // Quest types
    enum QuestType {
        Post,
        Comment,
        Like,
        Share,
        Follow,
        Invite
    }

    // Participant status
    enum ParticipantStatus {
        Active,
        Flagged,
        Suspended,
        Banned
    }

    // ========== STRUCTS ==========

    // Season information
    struct Season {
        uint256 id;
        uint256 startTime;
        uint256 endTime;
        uint256 prizePool;
        uint256 participantCount;
        SeasonState state;
        bool prizesDistributed;
    }

    // Participant information
    struct Participant {
        address userAddress;
        uint256 score;
        uint256 joinedTimestamp;
        uint256 lastQuestTimestamp;
        uint256 questsCompletedToday;
        uint256 lastDayReset;
        uint256 suspiciousActivityCount;
        ParticipantStatus status;
        bool hasClaimed;
    }

    // Quest definition
    struct Quest {
        QuestType questType;
        uint256 pointsValue;
        uint256 dailyLimit;
        bool isActive;
    }

    // Prize tier
    struct PrizeTier {
        uint256 position;
        uint256 percentageShare;
    }

    // ========== STATE VARIABLES ==========

    // Address where platform commissions are sent
    address payable public treasuryAddress;
    
    // Current active season
    uint256 public currentSeasonId;
    
    // Mapping from season ID to Season struct
    mapping(uint256 => Season) public seasons;
    
    // Mapping from season ID to participant address to Participant struct
    mapping(uint256 => mapping(address => Participant)) public seasonParticipants;
    
    // Mapping from season ID to array of participant addresses (for rankings)
    mapping(uint256 => address[]) public seasonParticipantAddresses;
    
    // Mapping from quest type to Quest struct
    mapping(QuestType => Quest) public quests;
    
    // Mapping from season ID to array of addresses ranked by score
    // This is populated when a season ends
    mapping(uint256 => address[]) public seasonRankings;
    
    // Prize tiers and their percentage shares
    PrizeTier[] public prizeTiers;
    
    // Mapping from user address to last quest completion timestamps by type
    // Used for suspicious activity detection
    mapping(address => mapping(QuestType => uint256[])) public questCompletionTimestamps;

    // ========== EVENTS ==========

    event SeasonCreated(uint256 indexed seasonId, uint256 startTime, uint256 endTime);
    event SeasonStateChanged(uint256 indexed seasonId, SeasonState state);
    event ParticipantJoined(uint256 indexed seasonId, address indexed participant, uint256 entryFee);
    event QuestCompleted(uint256 indexed seasonId, address indexed participant, QuestType questType, uint256 pointsEarned);
    event SuspiciousActivityDetected(uint256 indexed seasonId, address indexed participant, uint256 count);
    event ParticipantFlagged(uint256 indexed seasonId, address indexed participant, string reason);
    event ParticipantStatusChanged(uint256 indexed seasonId, address indexed participant, ParticipantStatus newStatus);
    event PrizesClaimed(uint256 indexed seasonId, address indexed participant, uint256 amount, uint256 position);
    event PrizesDistributed(uint256 indexed seasonId, uint256 totalDistributed, uint256 participantCount);

    // ========== CONSTRUCTOR ==========

    /**
     * @dev Constructor sets the treasury address and initializes quests and prize tiers
     * @param _treasuryAddress The address to receive platform commissions
     */
    constructor(address payable _treasuryAddress) Ownable(msg.sender) {
        require(_treasuryAddress != address(0), "Treasury cannot be zero address");
        treasuryAddress = _treasuryAddress;
        
        // Initialize default quests
        _initializeDefaultQuests();
        
        // Initialize default prize tiers
        _initializeDefaultPrizeTiers();
    }

    // ========== MODIFIERS ==========

    /**
     * @dev Ensures the season is in the required state
     * @param seasonId The ID of the season to check
     * @param state The required state
     */
    modifier inSeasonState(uint256 seasonId, SeasonState state) {
        require(seasons[seasonId].state == state, "Season is not in the required state");
        _;
    }

    /**
     * @dev Ensures the caller has paid the exact entry fee
     */
    modifier paidEntryFee() {
        require(msg.value == ENTRY_FEE, "Incorrect entry fee amount");
        _;
    }

    /**
     * @dev Ensures the caller is a registered participant in the season
     * @param seasonId The ID of the season
     */
    modifier isParticipant(uint256 seasonId) {
        Participant storage participant = seasonParticipants[seasonId][msg.sender];
        require(participant.userAddress != address(0), "Not a participant in this season");
        _;
    }

    /**
     * @dev Ensures the participant is not banned or suspended
     * @param seasonId The ID of the season
     */
    modifier isActiveParticipant(uint256 seasonId) {
        Participant storage participant = seasonParticipants[seasonId][msg.sender];
        require(
            participant.status != ParticipantStatus.Banned && 
            participant.status != ParticipantStatus.Suspended, 
            "Participant is not active"
        );
        _;
    }

    // ========== SEASON MANAGEMENT FUNCTIONS ==========

    /**
     * @dev Creates a new season
     * @return The ID of the newly created season
     */
    function createSeason() external onlyOwner whenNotPaused returns (uint256) {
        // If there's a current season, finalize it first if it's eligible
        if (currentSeasonId > 0) {
            Season storage currentSeason = seasons[currentSeasonId];
            if (currentSeason.state == SeasonState.Active && block.timestamp >= currentSeason.endTime) {
                finalizeSeason(currentSeasonId);
            }
        }
        
        // Create new season
        currentSeasonId++;
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + SEASON_DURATION;
        
        seasons[currentSeasonId] = Season({
            id: currentSeasonId,
            startTime: startTime,
            endTime: endTime,
            prizePool: 0,
            participantCount: 0,
            state: SeasonState.Registration,
            prizesDistributed: false
        });
        
        emit SeasonCreated(currentSeasonId, startTime, endTime);
        
        return currentSeasonId;
    }

    /**
     * @dev Starts a season that is in registration state
     * @param seasonId The ID of the season to start
     */
    function startSeason(uint256 seasonId)
        external
        onlyOwner
        whenNotPaused
        inSeasonState(seasonId, SeasonState.Registration)
    {
        Season storage season = seasons[seasonId];
        season.state = SeasonState.Active;
        
        emit SeasonStateChanged(seasonId, SeasonState.Active);
    }

    /**
     * @dev Finalizes a season that has ended
     * @param seasonId The ID of the season to finalize
     */
    function finalizeSeason(uint256 seasonId)
        public
        onlyOwner
        whenNotPaused
        inSeasonState(seasonId, SeasonState.Active)
    {
        Season storage season = seasons[seasonId];
        require(block.timestamp >= season.endTime, "Season has not ended yet");
        
        season.state = SeasonState.Finished;
        
        // Calculate rankings
        _calculateSeasonRankings(seasonId);
        
        emit SeasonStateChanged(seasonId, SeasonState.Finished);
    }

    /**
     * @dev Calculates and stores the rankings for a season
     * @param seasonId The ID of the season
     */
    function _calculateSeasonRankings(uint256 seasonId) internal {
        address[] storage participants = seasonParticipantAddresses[seasonId];
        uint256 participantCount = participants.length;
        
        // Create a temporary array for sorting
        address[] memory tempRankings = new address[](participantCount);
        for (uint256 i = 0; i < participantCount; i++) {
            tempRankings[i] = participants[i];
        }
        
        // Simple bubble sort by score (descending)
        for (uint256 i = 0; i < participantCount; i++) {
            for (uint256 j = i + 1; j < participantCount; j++) {
                uint256 scoreI = seasonParticipants[seasonId][tempRankings[i]].score;
                uint256 scoreJ = seasonParticipants[seasonId][tempRankings[j]].score;
                
                if (scoreJ > scoreI) {
                    // Swap
                    address temp = tempRankings[i];
                    tempRankings[i] = tempRankings[j];
                    tempRankings[j] = temp;
                }
            }
        }
        
        // Store the rankings
        seasonRankings[seasonId] = tempRankings;
    }

    // ========== PARTICIPANT FUNCTIONS ==========

    /**
     * @dev Allows a user to join the current season
     */
    function joinSeason()
        external
        payable
        whenNotPaused
        paidEntryFee
        returns (bool)
    {
        require(currentSeasonId > 0, "No active season");
        
        Season storage season = seasons[currentSeasonId];
        require(season.state == SeasonState.Registration || season.state == SeasonState.Active, 
                "Season is not open for registration");
        
        // Check if user is already a participant
        require(seasonParticipants[currentSeasonId][msg.sender].userAddress == address(0), 
                "Already registered for this season");
        
        // Calculate platform commission and prize pool contribution
        uint256 commissionAmount = (ENTRY_FEE * PLATFORM_COMMISSION_PERCENT) / 100;
        uint256 prizePoolContribution = ENTRY_FEE - commissionAmount;
        
        // Send commission to treasury
        payable(treasuryAddress).sendValue(commissionAmount);
        
        // Add to prize pool
        season.prizePool += prizePoolContribution;
        
        // Register participant
        Participant memory newParticipant = Participant({
            userAddress: msg.sender,
            score: 0,
            joinedTimestamp: block.timestamp,
            lastQuestTimestamp: 0,
            questsCompletedToday: 0,
            lastDayReset: block.timestamp / 1 days,
            suspiciousActivityCount: 0,
            status: ParticipantStatus.Active,
            hasClaimed: false
        });
        
        seasonParticipants[currentSeasonId][msg.sender] = newParticipant;
        seasonParticipantAddresses[currentSeasonId].push(msg.sender);
        season.participantCount++;
        
        emit ParticipantJoined(currentSeasonId, msg.sender, ENTRY_FEE);
        
        return true;
    }
    
    /**
     * @dev Gets a participant's information for a season
     * @param seasonId The ID of the season
     * @param participant The address of the participant
     * @return The participant struct
     */
    function getParticipantInfo(uint256 seasonId, address participant)
        external
        view
        returns (Participant memory)
    {
        return seasonParticipants[seasonId][participant];
    }

    /**
     * @dev Gets a participant's current score for a season
     * @param seasonId The ID of the season
     * @param participant The address of the participant
     * @return The participant's score
     */
    function getParticipantScore(uint256 seasonId, address participant)
        external
        view
        returns (uint256)
    {
        return seasonParticipants[seasonId][participant].score;
    }

    /**
     * @dev Gets all participants for a season
     * @param seasonId The ID of the season
     * @return Array of participant addresses
     */
    function getSeasonParticipants(uint256 seasonId)
        external
        view
        returns (address[] memory)
    {
        return seasonParticipantAddresses[seasonId];
    }

    // ========== QUEST SYSTEM FUNCTIONS ==========

    /**
     * @dev Initializes default quests
     */
    function _initializeDefaultQuests() internal {
        quests[QuestType.Post] = Quest({
            questType: QuestType.Post,
            pointsValue: 10,
            dailyLimit: 5,
            isActive: true
        });
        
        quests[QuestType.Comment] = Quest({
            questType: QuestType.Comment,
            pointsValue: 3,
            dailyLimit: 20,
            isActive: true
        });
        
        quests[QuestType.Like] = Quest({
            questType: QuestType.Like,
            pointsValue: 1,
            dailyLimit: 30,
            isActive: true
        });
        
        quests[QuestType.Share] = Quest({
            questType: QuestType.Share,
            pointsValue: 5,
            dailyLimit: 10,
            isActive: true
        });
        
        quests[QuestType.Follow] = Quest({
            questType: QuestType.Follow,
            pointsValue: 2,
            dailyLimit: 15,
            isActive: true
        });
        
        quests[QuestType.Invite] = Quest({
            questType: QuestType.Invite,
            pointsValue: 20,
            dailyLimit: 3,
            isActive: true
        });
    }

    /**
     * @dev Allows admin to set or update a quest
     * @param questType The type of quest
     * @param pointsValue The points awarded for completing the quest
     * @param dailyLimit The maximum number of times this quest can be completed daily
     * @param isActive Whether the quest is active
     */
    function setQuest(
        QuestType questType,
        uint256 pointsValue,
        uint256 dailyLimit,
        bool isActive
    )
        external
        onlyOwner
        whenNotPaused
    {
        require(dailyLimit <= MAX_DAILY_QUESTS, "Daily limit exceeds maximum");
        
        quests[questType] = Quest({
            questType: questType,
            pointsValue: pointsValue,
            dailyLimit: dailyLimit,
            isActive: isActive
        });
    }

    /**
     * @dev Records a quest completion for a participant
     * @param participant The address of the participant
     * @param questType The type of quest completed
     * @return pointsEarned The points earned for completing the quest
     */
    function completeQuest(
        address participant,
        QuestType questType
    )
        external
        onlyOwner
        whenNotPaused
        returns (uint256 pointsEarned)
    {
        require(currentSeasonId > 0, "No active season");
        require(seasons[currentSeasonId].state == SeasonState.Active, "Season is not active");
        
        Participant storage participantData = seasonParticipants[currentSeasonId][participant];
        require(participantData.userAddress != address(0), "Not a participant in this season");
        
        // Check participant status
        require(
            participantData.status != ParticipantStatus.Banned && 
            participantData.status != ParticipantStatus.Suspended,
            "Participant is not active"
        );
        
        // Check if quest is active
        Quest storage quest = quests[questType];
        require(quest.isActive, "Quest is not active");
        
        // Reset daily counters if needed
        _checkAndResetDailyLimit(currentSeasonId, participant);
        
        // Check daily limit
        require(participantData.questsCompletedToday < quest.dailyLimit, "Daily quest limit reached");
        
        // Record quest completion timestamp for suspicious activity detection
        _recordQuestCompletion(participant, questType);
        
        // Check for suspicious activity
        _checkForSuspiciousActivity(currentSeasonId, participant, questType);
        
        // Update participant data
        participantData.lastQuestTimestamp = block.timestamp;
        participantData.questsCompletedToday++;
        
        // Award points if participant is not flagged
        if (participantData.status == ParticipantStatus.Active) {
            participantData.score += quest.pointsValue;
            pointsEarned = quest.pointsValue;
        } else {
            // Flagged participants earn no points
            pointsEarned = 0;
        }
        
        emit QuestCompleted(currentSeasonId, participant, questType, pointsEarned);
        
        return pointsEarned;
    }

    /**
     * @dev Checks and resets daily limit counter if day has changed
     * @param seasonId The ID of the season
     * @param participant The address of the participant
     */
    function _checkAndResetDailyLimit(uint256 seasonId, address participant) internal {
        Participant storage participantData = seasonParticipants[seasonId][participant];
        uint256 currentDay = block.timestamp / 1 days;
        
        if (currentDay > participantData.lastDayReset) {
            participantData.questsCompletedToday = 0;
            participantData.lastDayReset = currentDay;
        }
    }

    /**
     * @dev Records a quest completion timestamp for suspicious activity detection
     * @param participant The address of the participant
     * @param questType The type of quest completed
     */
    function _recordQuestCompletion(address participant, QuestType questType) internal {
        uint256[] storage timestamps = questCompletionTimestamps[participant][questType];
        timestamps.push(block.timestamp);
        
        // Keep only the most recent timestamps (up to suspicious threshold)
        if (timestamps.length > SUSPICIOUS_ACTIVITY_THRESHOLD) {
            // Remove oldest timestamp by shifting array
            for (uint256 i = 0; i < timestamps.length - 1; i++) {
                timestamps[i] = timestamps[i + 1];
            }
            timestamps.pop();
        }
    }

    /**
     * @dev Checks for suspicious activity based on quest completion pattern
     * @param seasonId The ID of the season
     * @param participant The address of the participant
     * @param questType The type of quest completed
     */
    function _checkForSuspiciousActivity(
        uint256 seasonId,
        address participant,
        QuestType questType
    ) internal {
        uint256[] storage timestamps = questCompletionTimestamps[participant][questType];
        
        if (timestamps.length >= SUSPICIOUS_ACTIVITY_THRESHOLD) {
            uint256 oldestRelevantTimestamp = timestamps[timestamps.length - SUSPICIOUS_ACTIVITY_THRESHOLD];
            
            // If SUSPICIOUS_ACTIVITY_THRESHOLD quests were completed within SUSPICIOUS_TIME_WINDOW
            if (block.timestamp - oldestRelevantTimestamp <= SUSPICIOUS_TIME_WINDOW) {
                Participant storage participantData = seasonParticipants[seasonId][participant];
                participantData.suspiciousActivityCount++;
                
                emit SuspiciousActivityDetected(seasonId, participant, participantData.suspiciousActivityCount);
                
                // Auto-flag if suspicious activity is repeated
                if (participantData.suspiciousActivityCount >= 3 && 
                    participantData.status == ParticipantStatus.Active) {
                    participantData.status = ParticipantStatus.Flagged;
                    emit ParticipantStatusChanged(seasonId, participant, ParticipantStatus.Flagged);
                }
            }
        }
    }

    // ========== BOT DETECTION AND PENALTY SYSTEM ==========

    /**
     * @dev Allows admin to flag a participant for suspicious activity
     * @param seasonId The ID of the season
     * @param participant The address of the participant
     * @param reason The reason for flagging
     */
    function flagParticipant(
        uint256 seasonId,
        address participant,
        string calldata reason
    )
        external
        onlyOwner
        whenNotPaused
    {
        Participant storage participantData = seasonParticipants[seasonId][participant];
        require(participantData.userAddress != address(0), "Not a participant in this season");
        require(participantData.status == ParticipantStatus.Active, "Participant is not in active status");
        
        participantData.status = ParticipantStatus.Flagged;
        
        emit ParticipantFlagged(seasonId, participant, reason);
        emit ParticipantStatusChanged(seasonId, participant, ParticipantStatus.Flagged);
    }

    /**
     * @dev Allows admin to change a participant's status
     * @param seasonId The ID of the season
     * @param participant The address of the participant
     * @param newStatus The new status to set
     */
    function setParticipantStatus(
        uint256 seasonId,
        address participant,
        ParticipantStatus newStatus
    )
        external
        onlyOwner
        whenNotPaused
    {
        Participant storage participantData = seasonParticipants[seasonId][participant];
        require(participantData.userAddress != address(0), "Not a participant in this season");
        require(participantData.status != newStatus, "Already in this status");
        
        participantData.status = newStatus;
        
        emit ParticipantStatusChanged(seasonId, participant, newStatus);
    }

    /**
     * @dev Allows admin to apply a score penalty to a participant
     * @param seasonId The ID of the season
     * @param participant The address of the participant
     * @param penaltyAmount The amount of points to deduct
     */
    function applyScorePenalty(
        uint256 seasonId,
        address participant,
        uint256 penaltyAmount
    )
        external
        onlyOwner
        whenNotPaused
    {
        Participant storage participantData = seasonParticipants[seasonId][participant];
        require(participantData.userAddress != address(0), "Not a participant in this season");
        
        // Ensure we don't underflow
        if (penaltyAmount > participantData.score) {
            participantData.score = 0;
        } else {
            participantData.score -= penaltyAmount;
        }
    }

    // ========== PRIZE DISTRIBUTION FUNCTIONS ==========

    /**
     * @dev Initializes default prize tiers
     */
    function _initializeDefaultPrizeTiers() internal {
        // 1st place: 40%
        prizeTiers.push(PrizeTier({
            position: 1,
            percentageShare: 40
        }));
        
        // 2nd place: 25%
        prizeTiers.push(PrizeTier({
            position: 2,
            percentageShare: 25
        }));
        
        // 3rd place: 15%
        prizeTiers.push(PrizeTier({
            position: 3,
            percentageShare: 15
        }));
        
        // 4th-10th place: Share remaining 20%
        prizeTiers.push(PrizeTier({
            position: 4,
            percentageShare: 20
        }));
    }

    /**
     * @dev Allows admin to set prize tiers
     * @param tiers Array of prize tiers with position and percentage share
     */
    function setPrizeTiers(PrizeTier[] calldata tiers)
        external
        onlyOwner
        whenNotPaused
    {
        require(tiers.length > 0, "Must have at least one tier");
        
        // Validate total percentage is 100
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < tiers.length; i++) {
            totalPercentage += tiers[i].percentageShare;
        }
        require(totalPercentage == 100, "Total percentage must be 100");
        
        // Clear existing tiers and add new ones
        delete prizeTiers;
        for (uint256 i = 0; i < tiers.length; i++) {
            prizeTiers.push(tiers[i]);
        }
    }

    /**
     * @dev Allows a winner to claim their prize
     * @param seasonId The ID of the season
     */
    function claimPrize(uint256 seasonId)
        external
        nonReentrant
        whenNotPaused
        inSeasonState(seasonId, SeasonState.Finished)
    {
        Season storage season = seasons[seasonId];
        require(block.timestamp <= season.endTime + PRIZE_CLAIM_WINDOW, "Claim window has expired");
        
        Participant storage participant = seasonParticipants[seasonId][msg.sender];
        require(participant.userAddress != address(0), "Not a participant in this season");
        require(!participant.hasClaimed, "Prize already claimed");
        require(participant.status != ParticipantStatus.Banned, "Banned participants cannot claim prizes");
        
        // Get participant's position from rankings
        address[] storage rankings = seasonRankings[seasonId];
        require(rankings.length > 0, "Rankings not calculated");
        
        uint256 position = 0;
        for (uint256 i = 0; i < rankings.length; i++) {
            if (rankings[i] == msg.sender) {
                position = i + 1; // 1-indexed position
                break;
            }
        }
        
        require(position > 0, "Participant not found in rankings");
        
        // Calculate prize amount based on position
        uint256 prizeAmount = _calculatePrizeAmount(seasonId, position);
        require(prizeAmount > 0, "No prize to claim");
        
        // Mark as claimed
        participant.hasClaimed = true;
        
        // Transfer prize
        payable(msg.sender).sendValue(prizeAmount);
        
        emit PrizesClaimed(seasonId, msg.sender, prizeAmount, position);
    }

    /**
     * @dev Calculates the prize amount for a position
     * @param seasonId The ID of the season
     * @param position The position in the rankings (1-based)
     * @return The prize amount in wei
     */
    function _calculatePrizeAmount(uint256 seasonId, uint256 position)
        internal
        view
        returns (uint256)
    {
        Season storage season = seasons[seasonId];
        
        // If position is beyond our total participant count, no prize
        if (position > season.participantCount) {
            return 0;
        }
        
        // Find the applicable prize tier
        for (uint256 i = 0; i < prizeTiers.length; i++) {
            PrizeTier memory tier = prizeTiers[i];
            
            // If this is the right tier, or the last tier (catch-all)
            if (position == tier.position || i == prizeTiers.length - 1) {
                // For single position tiers
                if (i < prizeTiers.length - 1 && tier.position == prizeTiers[i+1].position - 1) {
                    return (season.prizePool * tier.percentageShare) / 100;
                } 
                // For range tiers (the last tier)
                else {
                    uint256 startPosition = tier.position;
                    uint256 endPosition;
                    
                    if (i == prizeTiers.length - 1) {
                        // Last tier includes all remaining positions
                        endPosition = season.participantCount;
                    } else {
                        endPosition = prizeTiers[i+1].position - 1;
                    }
                    
                    // Don't go beyond actual participant count
                    if (endPosition > season.participantCount) {
                        endPosition = season.participantCount;
                    }
                    
                    // Number of participants in this tier
                    uint256 participantsInTier = endPosition - startPosition + 1;
                    
                    // If position is within range, calculate equal share
                    if (position >= startPosition && position <= endPosition && participantsInTier > 0) {
                        return (season.prizePool * tier.percentageShare) / (100 * participantsInTier);
                    }
                }
            }
        }
        
        return 0;
    }

    /**
     * @dev Distributes unclaimed prizes after claim window
     * @param seasonId The ID of the season
     */
    function distributeUnclaimedPrizes(uint256 seasonId)
        external
        onlyOwner
        nonReentrant
        whenNotPaused
        inSeasonState(seasonId, SeasonState.Finished)
    {
        Season storage season = seasons[seasonId];
        require(block.timestamp > season.endTime + PRIZE_CLAIM_WINDOW, "Claim window has not expired");
        require(!season.prizesDistributed, "Prizes already distributed");
        
        // Calculate unclaimed amount
        uint256 totalPrizePool = season.prizePool;
        uint256 totalClaimed = 0;
        
        address[] storage rankings = seasonRankings[seasonId];
        for (uint256 i = 0; i < rankings.length; i++) {
            address participant = rankings[i];
            if (seasonParticipants[seasonId][participant].hasClaimed) {
                totalClaimed += _calculatePrizeAmount(seasonId, i + 1);
            }
        }
        
        uint256 unclaimedAmount = totalPrizePool - totalClaimed;
        
        // Mark season as distributed
        season.prizesDistributed = true;
        season.state = SeasonState.Distributed;
        
        // Send unclaimed amount to treasury
        if (unclaimedAmount > 0) {
            payable(treasuryAddress).sendValue(unclaimedAmount);
        }
        
        emit PrizesDistributed(seasonId, totalClaimed, season.participantCount);
        emit SeasonStateChanged(seasonId, SeasonState.Distributed);
    }

    // ========== ADMINISTRATIVE FUNCTIONS ==========

    /**
     * @dev Updates the treasury address
     * @param newTreasuryAddress The new treasury address
     */
    function setTreasuryAddress(address payable newTreasuryAddress)
        external
        onlyOwner
    {
        require(newTreasuryAddress != address(0), "Treasury cannot be zero address");
        treasuryAddress = newTreasuryAddress;
    }

    /**
     * @dev Pauses the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpauses the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdrawal of funds to owner
     * @param amount The amount to withdraw
     */
    function emergencyWithdraw(uint256 amount)
        external
        onlyOwner
        nonReentrant
    {
        require(amount <= address(this).balance, "Insufficient balance");
        payable(owner()).sendValue(amount);
    }
}