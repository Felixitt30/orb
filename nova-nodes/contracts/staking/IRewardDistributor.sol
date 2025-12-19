// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IRewardDistributor {
    function onNodeUpdate(uint256 nodeId, uint256 oldWeight, uint256 newWeight) external;
    function notifyRewardAmount(uint256 amount) external;
}
