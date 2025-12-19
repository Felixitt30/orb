// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/governance/utils/IVotes.sol";
import "@openzeppelin/contracts/utils/structs/Checkpoints.sol";

/**
 * @title veNOVA
 * @notice Vote-Escrowed NOVA: Lock NOVA tokens to receive voting power and yield boosts.
 * @dev Modeled after Curve's veToken model but simplified for Solidity 0.8.20.
 */
contract veNOVA is AccessControl, ReentrancyGuard, IVotes {
    using SafeERC20 for IERC20;
    using Checkpoints for Checkpoints.Trace208;

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    struct Lock {
        uint256 amount;
        uint64 end;
    }

    IERC20 public immutable nova;
    mapping(address => Lock) public locks;
    
    mapping(address => Checkpoints.Trace208) private _delegateCheckpoints;
    mapping(address => address) private _delegation;
    Checkpoints.Trace208 private _totalCheckpoints;

    uint256 public constant MIN_LOCK_TIME = 1 weeks;
    uint256 public constant MAX_LOCK_TIME = 4 * 365 days; // 4 years

    event Locked(address indexed user, uint256 amount, uint64 end);
    event Withdrawn(address indexed user, uint256 amount);

    constructor(address _nova) {
        nova = IERC20(_nova);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Lock NOVA tokens.
     * @param _amount Amount of NOVA to lock.
     * @param _duration Duration of the lock in seconds.
     */
    function createLock(uint256 _amount, uint256 _duration) external nonReentrant {
        require(_amount > 0, "Amount must be > 0");
        require(_duration >= MIN_LOCK_TIME, "Lock time too short");
        require(_duration <= MAX_LOCK_TIME, "Lock time too long");
        require(locks[msg.sender].amount == 0, "Lock already exists");

        uint64 unlockTime = uint64(block.timestamp + _duration);
        locks[msg.sender] = Lock({
            amount: _amount,
            end: unlockTime
        });

        nova.safeTransferFrom(msg.sender, address(this), _amount);

        // Voting power = amount * (duration / max_duration)
        uint256 power = (_amount * _duration) / MAX_LOCK_TIME;
        _moveVotingPower(address(0), _delegation[msg.sender] == address(0) ? msg.sender : _delegation[msg.sender], power);
        
        emit Locked(msg.sender, _amount, unlockTime);
    }

    /**
     * @notice Increase existing lock amount.
     */
    function increaseAmount(uint256 _amount) external nonReentrant {
        Lock storage lock = locks[msg.sender];
        require(lock.amount > 0, "No lock found");
        require(lock.end > block.timestamp, "Lock expired");

        lock.amount += _amount;
        nova.safeTransferFrom(msg.sender, address(this), _amount);

        uint256 duration = lock.end - block.timestamp;
        uint256 addedPower = (_amount * duration) / MAX_LOCK_TIME;
        _moveVotingPower(address(0), _delegation[msg.sender] == address(0) ? msg.sender : _delegation[msg.sender], addedPower);
    }

    /**
     * @notice Withdraw tokens after lock expires.
     */
    function withdraw() external nonReentrant {
        Lock memory lock = locks[msg.sender];
        require(lock.amount > 0, "No lock found");
        require(block.timestamp >= lock.end, "Lock not expired");

        uint256 amount = lock.amount;
        delete locks[msg.sender];

        // Voting power is already 0 as duration is 0, but we need to update checkpoints
        // In this simplified model, power decreases at the point of withdrawal.
        // A more advanced model would decay power over time.
        uint256 currentPower = getVotes(msg.sender);
        _moveVotingPower(_delegation[msg.sender] == address(0) ? msg.sender : _delegation[msg.sender], address(0), currentPower);

        nova.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    // IVotes implementation
    
    function getVotes(address account) public view override returns (uint256) {
        return _delegateCheckpoints[account].latest();
    }

    function getPastVotes(address account, uint256 timepoint) public view override returns (uint256) {
        require(timepoint < block.timestamp, "Future timepoint");
        return _delegateCheckpoints[account].upperLookup(uint48(timepoint));
    }

    function getTotalSupply() public view returns (uint256) {
        return _totalCheckpoints.latest();
    }

    function getPastTotalSupply(uint256 timepoint) public view returns (uint256) {
        require(timepoint < block.timestamp, "Future timepoint");
        return _totalCheckpoints.upperLookup(uint48(timepoint));
    }

    function delegates(address account) public view override returns (address) {
        return _delegation[account];
    }

    function delegate(address delegatee) public override {
        address currentDelegate = _delegation[msg.sender];
        _delegation[msg.sender] = delegatee;
        uint256 power = getVotes(msg.sender);
        _moveVotingPower(currentDelegate == address(0) ? msg.sender : currentDelegate, delegatee, power);
    }

    function clock() public view returns (uint48) {
        return uint48(block.timestamp);
    }

    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() public pure returns (string memory) {
        return "mode=timestamp";
    }

    function delegateBySig(address, uint256, uint256, uint8, bytes32, bytes32) public pure override {
        revert("Not implemented");
    }

    function _moveVotingPower(address from, address to, uint256 amount) internal {
        uint48 timepoint = uint48(block.timestamp);
        if (from != to && amount > 0) {
            if (from != address(0)) {
                _delegateCheckpoints[from].push(timepoint, _subtractUint256(getVotes(from), amount));
            }
            if (to != address(0)) {
                _delegateCheckpoints[to].push(timepoint, _addUint256(getVotes(to), amount));
            }
        }
        if (from == address(0) && to != address(0)) {
             _totalCheckpoints.push(timepoint, _addUint256(getTotalSupply(), amount));
        }
        if (from != address(0) && to == address(0)) {
             _totalCheckpoints.push(timepoint, _subtractUint256(getTotalSupply(), amount));
        }
    }

    function _addUint256(uint256 a, uint256 b) internal pure returns (uint208) {
        uint256 c = a + b;
        require(c <= type(uint208).max, "Overflow");
        return uint208(c);
    }

    function _subtractUint256(uint256 a, uint256 b) internal pure returns (uint208) {
        require(b <= a, "Underflow");
        return uint208(a - b);
    }
}
