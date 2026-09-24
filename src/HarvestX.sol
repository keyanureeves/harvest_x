// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {HarvestXToken} from "./HarvestXToken.sol";

interface IPriceOracle {
    //getting price from mock oracle
    function getCarbonCreditPricePerTon() external view returns (uint256);
}

contract HarvestX is Ownable {
    //structs
    struct FarmerData {
        bool isRegistered;
        uint256 totalWasteKg;
        uint256 totalCO2Saved;
        uint256 totalProductKg;
        uint256 totalWorkersPaid; //reconsider having it
        uint256 totalPayoutKES; //?? in Hx token??
    }

    struct WasteCollection {
        uint256 kgCollected;
        uint256 timestamp;
        uint256 workersInvolved;
        uint256 workersPaymentKES; // to check economic growth
        string wasteType; // NEW - needed by processWaste emit
    }

    struct WorkerPayment {
        address worker; // address can be zero if cash payment
        uint256 amountKES; // for economic growth and business creation
        uint256 timestamp;
    }

    //state variables

    //constants
    uint256 public constant TOKENS_PER_10KG = 1e18; // 1 OWG per 10kg
    uint256 public constant CO2_PER_KG = 400e18; //grams of CO2e per kg (with 18 decimals)
    uint256 public constant GRAMS_PER_TON = 1e6; // 1 ton = 1,000,000 grams
    uint256 public constant CO2_GRAMS_PER_TON = 1e3 * CO2_PER_KG; // 400,000e18 = CO2 in "grams" per ton

    //other state variables
    uint256 public totalFarmers;
    uint256 public globalWasteKg;
    uint256 public globalCO2Saved; //grams
    uint256 public totalCarbonCreditsSold; //tons

    //price related variables
    uint256 minPricePerTon = 100e8;
    uint256 platformFeePercentage = 2;

    // uint256 public minPricePerTon = 1000; // Minimum USD per ton//??price from mock oracle thcen
    // uint256 public minPaymentPerTon = 0.0001 ether; //??//Native coin polkadot

    //farmer tracking
    mapping(address => FarmerData) public farmers;
    mapping(address => WasteCollection[]) public wasteHistory;
    mapping(address => WorkerPayment[]) public workerPayments;

    //carbon credit tracking
    mapping(address => uint256) public carbonCreditsEarned;
    mapping(address => uint256) public carbonCreditsClaimed;
    mapping(address => bool) public verifiedFarmers;

    //corporate buyer tracking
    mapping(address => uint256) public corporateCreditsPurchased;

    //contract instances
    IERC20 USDC;

    HarvestXToken public hxToken; //confirming the HX token// HarvestXToken public hxToken?? //links to the import for ref
    IPriceOracle public priceOracle;

    //events
    //removed some events for simplicity but we can add them later for better tracking and transparency

    event FarmerRegistered(address indexed farmer, uint256 timestamp);

    event WasteProcessed(
        address indexed farmer,
        uint256 kg, //consider renaming this
        uint256 tokensMinted,
        uint256 CO2Saved,
        uint256 wworkersInvolved,
        uint256 workerPayment, //could also intergrate Hx token to workers involved
        uint256 timestamp
    );

    event ProductClaimed(
        address indexed farmer,
        uint256 productKg,
        uint256 tokensminted,
        uint256 timestamp // FIXED - "timestamo" -> "timestamp"
    );

    event CarbonCreditIssued(
        address indexed farmer,
        uint256 co2Grams,
        uint256 timestamp
    );

    event CarbonCreditSold(
        address indexed farmer,
        address indexed buyer,
        uint256 tonsCO2,
        uint256 priceUSD,
        uint256 priceUSDC, // check args for this
        uint256 timestamp
    );

    event FarmerVerified(address indexed farmer, uint256 timestamp);
    event OracleUpdated(address indexed newOracle, uint256 timestamp);
    event USDCUpdated(address indexed newUSDC, uint256 timestamp);
    event PlatformFeeUpdated(uint256 newFee, uint256 timestamp);
    event MinPriceUpdated(uint256 newPrice, uint256 timestamp);
    event PlatformFeesWithdrawn(uint256 amount, uint256 timestamp);

    event InsufficientReserves(
        address indexed farmer,
        uint256 requestedTokens,
        uint256 mintableSupply
    );

    event Redeemed(
        address indexed farmer,
        uint256 owgAmount,
        uint256 usdcAmount
    );

    //constructor
    constructor(
        address _hxTokenAddress,
        address _priceOracleAddress,
        address _usdc
    ) Ownable(msg.sender) {
        hxToken = HarvestXToken(_hxTokenAddress);
        priceOracle = IPriceOracle(_priceOracleAddress);
        USDC = IERC20(_usdc);
    }

    //modifiers
    modifier onlyVerifiedFarmer() {
        require(farmers[msg.sender].isRegistered, "Not registered");
        require(verifiedFarmers[msg.sender], "Farmer not verified");
        _;
    }

    //functions
    //farmer functions
    function register() external {
        require(!farmers[msg.sender].isRegistered, "Already registered");
        farmers[msg.sender].isRegistered = true;
        totalFarmers++; //is there an event missing here for registration
        emit FarmerRegistered(msg.sender, block.timestamp);
    }

    //set minimum price per ton//should be in usd or kes? we can have a mock oracle to convert the price from usd to kes and vice versa
    function setMinPricePerTon(uint256 _minPrice) external onlyOwner {
        require(_minPrice > 0, "Price must be > 0");
        minPricePerTon = _minPrice;
        emit MinPriceUpdated(_minPrice, block.timestamp);
    }

    //set platform fee
    function setPlatformFee(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 10, "Fee too high"); //Max 10%
        platformFeePercentage = _feePercentage;
        emit PlatformFeeUpdated(_feePercentage, block.timestamp);
    }

    //updating oracle
    function updateOracle(address _newOracle) external onlyOwner {
        require(_newOracle != address(0), "Invalid address");
        priceOracle = IPriceOracle(_newOracle);
        emit OracleUpdated(_newOracle, block.timestamp);
    }

    //updating USDC
    //useful for switching between a mock usdc and the real usdc per chain
    function updateUSDC(address _newUSDC) external onlyOwner {
        require(_newUSDC != address(0), "Invalid address");
        USDC = IERC20(_newUSDC);
        emit USDCUpdated(_newUSDC, block.timestamp);
    }

    function verifyFarmer(address _farmer) external onlyOwner {
        require(farmers[_farmer].isRegistered, "Farmer not registere");
        verifiedFarmers[_farmer] = true;
        emit FarmerVerified(_farmer, block.timestamp);
    }

    function revokeVerification(address _farmer) external onlyOwner {
        verifiedFarmers[_farmer] = false;
    }

    //check reserve status for minting
    //Farm processing
    function processWaste(
        uint256 collectedWasteKg,
        string calldata _wasteType,
        uint256 _workersInvolved,
        uint256 _workersPaymentKES
    ) external {
        // require(farmers[msg.sender].isRegistered, "Not registered");
        require(collectedWasteKg >= 10, "Minimum 10kg");
        require(_workersInvolved > 0, "At least 1 worker"); //added these
        require(_workersPaymentKES > 0, "Payment must be > 0"); //these also

        //rewards
        uint256 tokens = (collectedWasteKg / 10) * TOKENS_PER_10KG;
        uint256 co2 = collectedWasteKg * CO2_PER_KG;

        // Check if reserves can support this mint
        // (bool canMint_, uint256 mintable) = canMint(tokens);
        // require(canMint_, "Insufficient reserves for minting");

        //updating farmer stats
        // farmers[msg.sender].totalWasteKg += collectedWasteKg;
        // farmers[msg.sender].totalWorkersPaid += _workersInvolved;
        // farmers[msg.sender].totalPayoutKES += _workersPaymentKES;
        // farmers[msg.sender].totalCO2Saved += co2;

        //updating alternative
        FarmerData storage farmer = farmers[msg.sender];
        farmer.totalWasteKg += collectedWasteKg;
        farmer.totalWorkersPaid += _workersInvolved;
        farmer.totalPayoutKES += _workersPaymentKES;
        farmer.totalCO2Saved += co2;

        //tracking carbon credits (the ones available for sale)
        carbonCreditsEarned[msg.sender] += co2;

        //updating global variables
        globalWasteKg += collectedWasteKg;
        globalCO2Saved += co2;

        //storing collection record
        wasteHistory[msg.sender].push(
            WasteCollection({
                kgCollected: collectedWasteKg,
                timestamp: block.timestamp,
                workersInvolved: _workersInvolved,
                workersPaymentKES: _workersPaymentKES,
                wasteType: _wasteType
            })
        );

        // Oracles for PoR and IOT
        // Only proceed to mint if there is enough USD in reserve and there is verifiable amount data from IOT
        // If neither threshold met revert tx

        // TO DO: Add Logic here from may be IOT

        //Mint Tokens

        //Mint tokens
        hxToken.mint(msg.sender, tokens);

        emit WasteProcessed(
            msg.sender,
            collectedWasteKg,
            tokens,
            co2,
            _workersInvolved,
            _workersPaymentKES,
            block.timestamp
        );

        emit CarbonCreditIssued(msg.sender, co2, block.timestamp);
    }

    function claimProductTokens(uint256 _productKg) external {
        //future consideration for a verified farmers only
        require(_productKg > 0, "Amount must be greater than zero");

        uint256 tokens = (_productKg * TOKENS_PER_10KG) / 10;

        //check reserves

        farmers[msg.sender].totalProductKg += _productKg;

        //add verification logic from IOt

        // HxToken.mint(msg.sender.tokens); // OLD - wrong var "HxToken", "msg.sender.tokens" invalid
        hxToken.mint(msg.sender, tokens);

        emit ProductClaimed(msg.sender, _productKg, tokens, block.timestamp);
    }

    //tonsCO2 is in hundredths (e.g 1.5 tons = 150) //this is a problem
    function buyCarbonCredits(
        address _farmer,
        uint256 _tonsCO2,
        uint256 _amountUSDC
    ) external {
        require(_tonsCO2 > 0, "Must purchase at 0.01 ton of CO2"); //this is a problem
        require(_amountUSDC > 0, "USDC must be greater than zero ");
        require(farmers[_farmer].isRegistered, "Farmer is not registered");

        //convert form hundreths to grams: _tonsCO2  * CO2_GRAMS_PER_TON/100
        uint256 _creditsToBuy = (_tonsCO2 * CO2_GRAMS_PER_TON) / 100;
        uint256 availableCredits = carbonCreditsEarned[_farmer] -
            carbonCreditsClaimed[_farmer];

        require(availableCredits >= _creditsToBuy, "Insufficient credits");

        //calculate price in USD from Oracle
        uint256 pricePerTonUSD = priceOracle.getCarbonCreditPricePerTon();
        require(pricePerTonUSD >= minPricePerTon, "Price below minimum");

        //Total price: (_tonsCO2/100) gives the actual tons
        uint256 totalPriceUSD = (_tonsCO2 * pricePerTonUSD) / 100;

        //convert to USDC (6 decimals) - correct way ?!?
        uint256 totalPriceUSDC = (totalPriceUSD * 1e6) / 1e8;

        require(_amountUSDC >= totalPriceUSDC, "Insufficient USDC amount");

        //Calculate platform fee in USDC
        uint256 platformFeeUSDC = (totalPriceUSDC * platformFeePercentage) /
            100;
        uint256 farmerPayoutUSDC = totalPriceUSDC - platformFeeUSDC;

        //transfer USDC from buyer to contract
        require(
            USDC.transferFrom(msg.sender, address(this), totalPriceUSDC),
            "USDC transfer failed"
        );

        //mark credits as sold
        carbonCreditsClaimed[_farmer] += _creditsToBuy;
        corporateCreditsPurchased[msg.sender] += _creditsToBuy;

        //transfer USDC payment to farmer
        require(
            USDC.transfer(_farmer, farmerPayoutUSDC),
            "Farmer USDC payment failed"
        );

        emit CarbonCreditSold(
            _farmer,
            msg.sender,
            _tonsCO2,
            totalPriceUSD,
            totalPriceUSDC,
            block.timestamp
        );
    }

    function redeemHxForStablecoin(
        uint256 _hxAmount
    ) external onlyVerifiedFarmer {
        //verify and update farmer data
        //check
        require(_hxAmount > 0, "Insufficient amount");

        //we need to convert the _hxAmount(18 decimals) to USDC amount (6 decimals)
        uint256 usdcAmount = (_hxAmount * 1e6) / 1e18;

        // require(_hxToken.balanceOf(msg.sender) >= usdcAmount, "Insufficient amount of Hx token"); // OLD - no such var, contract var is "hxToken"
        require(
            hxToken.balanceOf(msg.sender) >= usdcAmount,
            "Insufficient amount of Hx token"
        );
        require(
            USDC.balanceOf(address(this)) >= usdcAmount,
            "Insufficient USDC in contract"
        );

        //burn tokens
        //hxToken.redeem (_hxAmount);
        hxToken.burnFrom(msg.sender, _hxAmount);

        //transfer USDC to farmer
        require(USDC.transfer(msg.sender, usdcAmount), "USDC transfer failed");

        //emit events
        emit Redeemed(msg.sender, _hxAmount, usdcAmount);
    }

    //view functions
    //check if redemption is possible
    function checkRedemptionStatus(
        uint256 hxAmount
    )
        external
        view
        returns (
            bool canRedeem,
            string memory reason,
            uint256 usdcAmount,
            uint256 contractUSDCBalance,
            uint256 userHXBalance,
            bool isRegistered,
            bool isVerified
        )
    {
        isRegistered = farmers[msg.sender].isRegistered;
        isVerified = verifiedFarmers[msg.sender];
        userHXBalance = hxToken.balanceOf(msg.sender);
        contractUSDCBalance = USDC.balanceOf(address(this));

        if (!isRegistered) {
            return (
                false,
                "Not registered as a farmer",
                0,
                contractUSDCBalance,
                userHXBalance,
                isRegistered,
                isVerified
            );
        }
        if (!isVerified) {
            return (
                false,
                "Farmer not verified",
                0,
                contractUSDCBalance,
                userHXBalance,
                isRegistered,
                isVerified
            );
        }
        if (hxAmount == 0) {
            return (
                false,
                "Amount must be > 0",
                0,
                contractUSDCBalance,
                userHXBalance,
                isRegistered,
                isVerified
            );
        }
        if (userHXBalance < hxAmount) {
            return (
                false,
                "Insufficient USDC in contract",
                usdcAmount,
                contractUSDCBalance,
                userHXBalance,
                isRegistered,
                isVerified
            );
        }

        usdcAmount = (hxAmount * 1e6) / 1e18;

        if (contractUSDCBalance < usdcAmount) {
            return (
                false,
                "Insufficient USDC in contract",
                usdcAmount,
                contractUSDCBalance,
                userHXBalance,
                isRegistered,
                isVerified
            );
        }

        return (
            true,
            "Ready to redeem",
            usdcAmount,
            contractUSDCBalance,
            userHXBalance,
            isRegistered,
            isVerified
        );
    }

    function getAvailableCarbonCredits(
        address _farmer
    )
        external
        view
        returns (
            uint256 available,
            uint256 totalEarned,
            uint256 sold,
            uint256 estimatedValueUSDC
        )
    {
        uint256 earned = carbonCreditsEarned[_farmer];
        uint256 claimed = carbonCreditsClaimed[_farmer];
        uint256 _available = earned - claimed;

        available = (_available * 100) / CO2_GRAMS_PER_TON;
        totalEarned = (earned * 100) / CO2_GRAMS_PER_TON;
        sold = (claimed * 100) / CO2_GRAMS_PER_TON;

        if (available > 0) {
            uint256 pricePerTonUSD = priceOracle.getCarbonCreditPricePerTon();
            uint256 estimatedValueUSD = (available * pricePerTonUSD) / 100;
            estimatedValueUSDC = (estimatedValueUSD * 1e6) / 1e18;
        }
    }

    //get reserve status

    //withdraw platform fees(only owner)

    //function get Impact
    function getImpact(
        address farmer
    )
        external
        view
        returns (
            uint256 wasteKg,
            uint256 productKg,
            uint256 co2Grams,
            uint256 co2Kg,
            uint256 tokens,
            uint256 workersPaid,
            uint256 totalPayoutKES
        )
    {
        FarmerData memory data = farmers[farmer];

        return (
            data.totalWasteKg,
            data.totalProductKg,
            data.totalCO2Saved,
            data.totalCO2Saved / 1e18 / 1000,
            hxToken.balanceOf(farmer),
            data.totalWorkersPaid,
            data.totalPayoutKES
        );
    }

    function getGlobalStats()
        external
        view
        returns (
            uint256 farmersCount,
            uint256 wasteKg,
            uint256 co2SavedKg,
            uint256 tokensCirculating,
            uint256 carbonCreditsSolTons,
            uint256 platformFeesHX
        )
    {
        return (
            totalFarmers,
            globalWasteKg,
            globalCO2Saved / 1e18 / 1000,
            hxToken.totalSupply(),
            totalCarbonCreditsSold,
            hxToken.balanceOf(address(this))
        );
    }

    function getWastehistory(
        address farmer
    ) external view returns (WasteCollection[] memory) {
        return wasteHistory[farmer];
    }

    function getWorkerPayments(
        address farmer
    ) external view returns (WorkerPayment[] memory) {
        return workerPayments[farmer];
    }

    function getCorporatePurchases(
        address _buyer
    ) external view returns (uint256) {
        return corporateCreditsPurchased[_buyer];
    }

    function withdrawPlatformFees(uint256 amount) external onlyOwner {
        require(amount <= USDC.balanceOf(address(this)), "Insufficient funds");
        require(USDC.transfer(owner(), amount), "Withdrawal failed");

        emit PlatformFeesWithdrawn(amount, block.timestamp);
    }

    //helper functions
    //_tonsCO2 is in the hundreths ( e.g 1.5 tons = 150)
    function calculatePriceInUSDC(
        uint256 _tonsCO2
    ) external view returns (uint256 priceUSD, uint256 priceUSDC) {
        uint256 pricePerTonUSD = priceOracle.getCarbonCreditPricePerTon();
        //total price:(_tonsCO2/100) gives the actual tons
        priceUSD = (_tonsCO2 * pricePerTonUSD) / 100;

        //convert USD (18 decimals) to USDC (6 decimals)
        priceUSDC = (priceUSD * 1e6) / 1e8;
    }
}
