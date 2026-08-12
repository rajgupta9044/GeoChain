// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "@openzeppelin/contracts/access/AccessControl.sol";

contract GeoDataRegistry is AccessControl {
    bytes32 public constant PROVIDER_ROLE = keccak256("PROVIDER_ROLE");
    enum Status { NONE, ACTIVE, DEACTIVATED }
    struct Version { bytes32 fileHash; string cid; uint64 createdAt; address registeredBy; }
    struct Dataset { address owner; Status status; uint64 currentVersion; mapping(uint64 => Version) versions; }
    mapping(bytes32 => Dataset) private datasets;
    event DatasetRegistered(bytes32 indexed datasetId, uint64 version, bytes32 fileHash, string cid, address indexed provider);
    event DatasetVersionAdded(bytes32 indexed datasetId, uint64 version, bytes32 fileHash, string cid, address indexed provider);
    event DatasetDeactivated(bytes32 indexed datasetId, address indexed provider);
    constructor(address admin) { _grantRole(DEFAULT_ADMIN_ROLE, admin); _grantRole(PROVIDER_ROLE, admin); }
    function grantProvider(address account) external onlyRole(DEFAULT_ADMIN_ROLE) { grantRole(PROVIDER_ROLE, account); }
    function registerDataset(bytes32 id, bytes32 fileHash, string calldata cid) external onlyRole(PROVIDER_ROLE) { require(datasets[id].status == Status.NONE, "dataset exists"); Dataset storage d = datasets[id]; d.owner = msg.sender; d.status = Status.ACTIVE; d.currentVersion = 1; d.versions[1] = Version(fileHash, cid, uint64(block.timestamp), msg.sender); emit DatasetRegistered(id, 1, fileHash, cid, msg.sender); }
    function addVersion(bytes32 id, bytes32 fileHash, string calldata cid) external onlyRole(PROVIDER_ROLE) { Dataset storage d = datasets[id]; require(d.status == Status.ACTIVE, "dataset inactive"); uint64 v = ++d.currentVersion; d.versions[v] = Version(fileHash, cid, uint64(block.timestamp), msg.sender); emit DatasetVersionAdded(id, v, fileHash, cid, msg.sender); }
    function deactivate(bytes32 id) external { Dataset storage d = datasets[id]; require(msg.sender == d.owner || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "not owner"); d.status = Status.DEACTIVATED; emit DatasetDeactivated(id, msg.sender); }
    function getDataset(bytes32 id) external view returns (address owner, Status status, uint64 currentVersion) { Dataset storage d = datasets[id]; return (d.owner, d.status, d.currentVersion); }
    function getVersion(bytes32 id, uint64 version) external view returns (bytes32 fileHash, string memory cid, uint64 createdAt, address registeredBy) { Version storage v = datasets[id].versions[version]; return (v.fileHash, v.cid, v.createdAt, v.registeredBy); }
}
