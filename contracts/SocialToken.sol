// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/ISocialToken.sol";

/**
 * @title SocialToken
 * @dev ERC20 token implementation for the social engagement platform
 */
contract SocialToken is ISocialToken {
    string public name = "SocialEngagement";
    string public symbol = "SENG";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    // Platform owner address
    address public owner;
    
    // Mapping of address to token balance
    mapping(address => uint256) private _balances;
    
    // Mapping of address to mapping of spender to allowance
    mapping(address => mapping(address => uint256)) private _allowances;
    
    // Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    /**
     * @dev Constructor that sets the platform owner
     */
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Modifier to restrict function access to the owner
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "SocialToken: caller is not the owner");
        _;
    }
    
    /**
     * @dev See {ISocialToken-mint}
     * Minting is restricted to the platform owner
     */
    function mint(address to, uint256 amount) external override onlyOwner returns (bool) {
        require(to != address(0), "SocialToken: mint to the zero address");
        
        totalSupply += amount;
        _balances[to] += amount;
        emit Transfer(address(0), to, amount);
        return true;
    }
    
    /**
     * @dev See {ISocialToken-burn}
     * Burning is restricted to the platform owner
     */
    function burn(address from, uint256 amount) external override onlyOwner returns (bool) {
        require(from != address(0), "SocialToken: burn from the zero address");
        uint256 accountBalance = _balances[from];
        require(accountBalance >= amount, "SocialToken: burn amount exceeds balance");
        
        _balances[from] = accountBalance - amount;
        totalSupply -= amount;
        emit Transfer(from, address(0), amount);
        return true;
    }
    
    /**
     * @dev See {ISocialToken-balanceOf}
     */
    function balanceOf(address account) external view override returns (uint256) {
        return _balances[account];
    }
    
    /**
     * @dev Transfers tokens to a specified address
     * @param to The address to transfer to
     * @param amount The amount to be transferred
     * @return A boolean that indicates if the operation was successful
     */
    function transfer(address to, uint256 amount) external returns (bool) {
        require(to != address(0), "SocialToken: transfer to the zero address");
        address sender = msg.sender;
        uint256 senderBalance = _balances[sender];
        require(senderBalance >= amount, "SocialToken: transfer amount exceeds balance");

        _balances[sender] = senderBalance - amount;
        _balances[to] += amount;
        emit Transfer(sender, to, amount);
        return true;
    }
    
    /**
     * @dev See {ISocialToken-transferFrom}
     */
    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        require(to != address(0), "SocialToken: transfer to the zero address");
        require(from != address(0), "SocialToken: transfer from the zero address");
        
        uint256 currentAllowance = _allowances[from][msg.sender];
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "SocialToken: insufficient allowance");
            _allowances[from][msg.sender] = currentAllowance - amount;
        }
        
        uint256 fromBalance = _balances[from];
        require(fromBalance >= amount, "SocialToken: transfer amount exceeds balance");
        _balances[from] = fromBalance - amount;
        _balances[to] += amount;
        
        emit Transfer(from, to, amount);
        return true;
    }
    
    /**
     * @dev Sets amount as the allowance of spender over the caller's tokens
     * @param spender The address which will spend the funds
     * @param amount The amount of tokens to be spent
     * @return A boolean that indicates if the operation was successful
     */
    function approve(address spender, uint256 amount) external returns (bool) {
        require(spender != address(0), "SocialToken: approve to the zero address");
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    /**
     * @dev Returns the remaining number of tokens that spender will be allowed to spend on behalf of owner
     * @param owner The address of the owner of the tokens
     * @param spender The address of the account allowed to spend tokens
     * @return The number of tokens remaining available
     */
    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowances[owner][spender];
    }
}