contract EtherProof {
    struct File {
        uint timestamp;
        uint blockNumber;
    }
    
    mapping (bytes32 => File) Registry;
    
    function checkExistence(bytes32 hash) constant returns (bool) {
        return Registry[hash].timestamp != 0 && Registry[hash].blockNumber != 0;
    }
    
    function addFile(bytes32 hash) {
        if (checkExistence(hash) && msg.value < 100000) throw;
        Registry[hash] = File(now, block.number);
    }
    
    function getTimestamp(bytes32 hash) constant returns(uint) {
        return Registry[hash].timestamp;
    }
    
    function getBlockNumber(bytes32 hash) constant returns(uint) {
        return Registry[hash].blockNumber;
    }
}
