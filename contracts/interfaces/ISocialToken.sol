// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ISocialToken
 * @dev Interface for the social platform's token contract
 */
interface ISocialToken {
    /**
     * @dev Mints tokens to an account
     * @param to The address that will receive the minted tokens
     * @param amount The amount of tokens to mint
     * @return A boolean that indicates if the operation was successful
     */
    function mint(address to, uint256 amount) external returns (bool);
    
    /**
     * @dev Burns tokens from an account
     * @param from The address from which tokens will be burned
     * @param amount The amount of tokens to burn
     * @return A boolean that indicates if the operation was successful
     */
    function burn(address from, uint256 amount) external returns (bool);
    
    /**
     * @dev Transfers tokens between accounts
     * @param from The sender's address
     * @param to The recipient's address
     * @param amount The amount of tokens to transfer
     * @return A boolean that indicates if the operation was successful
     */
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    
    /**
     * @dev Returns the balance of an account
     * @param account The address to query the balance of
     * @return The account's token balance
     */
    function balanceOf(address account) external view returns (uint256);
}