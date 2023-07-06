const { ethers } = require("hardhat");

async function main() {


  // Deploy the contract
  const LeveragedYieldFarm = await ethers.getContractFactory("LeveragedYieldFarm");
  console.log("Deploying LeveragedYieldFarm...");
  const leveragedYieldFarm = await LeveragedYieldFarm.deploy();
  await leveragedYieldFarm.deployed();
  console.log("LeveragedYieldFarm deployed to:", leveragedYieldFarm.address);

  // Perform additional setup or configuration if needed
  // ...

  // You can interact with the deployed contract here
  // ...

  // Run any other tasks or scripts
  // ...
}

// Execute the deployment script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
