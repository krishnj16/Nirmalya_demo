// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract GarbageRewardSystem {
    // Struct to define the data for each garbage submission
    struct GarbageSubmission {
        uint256 submissionId;
        address submitter;
        string trashType; // e.g., "plastic", "glass", "organic", "metal"
        uint256 weightKg; // Weight in kilograms
        string locationType; // e.g., "residential", "commercial", "industrial"
        string citizenType; // e.g., "taxpayer", "ration_card_holder"
        uint256 areaDirtinessLevel; // Level from 1 to 5
        uint256 rewardAmount; // Reward in a base unit (e.g., wei, or a custom token unit)
        uint256 timestamp;
    }

    // Mapping to store submissions by their unique ID
    mapping(uint256 => GarbageSubmission) public submissions;

    // Counter for unique submission IDs
    uint256 private nextSubmissionId;

    // Event to log successful garbage submissions
    event GarbageSubmitted(
        uint256 indexed submissionId,
        address indexed submitter,
        string trashType,
        uint256 weightKg,
        uint256 rewardAmount,
        uint256 timestamp
    );

    // Constructor: Initializes the next submission ID
    constructor() {
        nextSubmissionId = 1;
    }

    /**
     * @dev Submits garbage separation data and records a reward.
     * @param _trashType The type of trash (e.g., "plastic").
     * @param _weightKg The weight of the trash in kilograms.
     * @param _locationType The type of location where the trash was collected.
     * @param _citizenType The type of citizen submitting the trash.
     * @param _areaDirtinessLevel The dirtiness level of the area (1-5).
     * @param _rewardAmount The calculated reward amount for this submission.
     */
    function submitGarbage(
        string memory _trashType,
        uint256 _weightKg,
        string memory _locationType,
        string memory _citizenType,
        uint256 _areaDirtinessLevel,
        uint256 _rewardAmount
    ) public {
        require(_weightKg > 0, "Weight must be greater than 0");
        require(_areaDirtinessLevel >= 1 && _areaDirtinessLevel <= 5, "Area dirtiness level must be between 1 and 5");
        require(_rewardAmount > 0, "Reward amount must be greater than 0");

        uint256 currentSubmissionId = nextSubmissionId;
        submissions[currentSubmissionId] = GarbageSubmission({
            submissionId: currentSubmissionId,
            submitter: msg.sender,
            trashType: _trashType,
            weightKg: _weightKg,
            locationType: _locationType,
            citizenType: _citizenType,
            areaDirtinessLevel: _areaDirtinessLevel,
            rewardAmount: _rewardAmount,
            timestamp: block.timestamp
        });

        nextSubmissionId++;

        emit GarbageSubmitted(
            currentSubmissionId,
            msg.sender,
            _trashType,
            _weightKg,
            _rewardAmount,
            block.timestamp
        );
    }

    function getSubmission(uint256 _submissionId)
        public
        view
        returns (
            uint256 submissionId,
            address submitter,
            string memory trashType,
            uint256 weightKg,
            string memory locationType,
            string memory citizenType,
            uint256 areaDirtinessLevel,
            uint256 rewardAmount,
            uint256 timestamp
        )
    {
        GarbageSubmission storage submission = submissions[_submissionId];
        require(submission.submissionId != 0, "Submission does not exist");

        return (
            submission.submissionId,
            submission.submitter,
            submission.trashType,
            submission.weightKg,
            submission.locationType,
            submission.citizenType,
            submission.areaDirtinessLevel,
            submission.rewardAmount,
            submission.timestamp
        );
    }

    /**
     * @dev Returns the total number of submissions made so far.
     * @return The total count of submissions.
     */
    function getTotalSubmissions() public view returns (uint256) {
        return nextSubmissionId - 1;
    }
}
