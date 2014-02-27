# Gateway

Fetching a block header
```
$ curl http://localhost:8888/block/000000000000000145f738890dc703e7637b677f15e9a49ea2eeca6e6e3c5f51
{"nonce": 2595258480, "timestamp": 1391031759, "version": 2, "prev_hash": "00000000000000012af08fe29312627aa6f74aa7f617925da4f4f3a572a95da0", "merkle": "088d6b08fbca5c9fb5c1970a7af5a17847d67635b80ca6f12bd982218e2a83ac", "bits": 419558700}
```

Fetching block transactions
```
$ curl http://localhost:8888/block/000000000000000145f738890dc703e7637b677f15e9a49ea2eeca6e6e3c5f51/transactions
{"transactions": ["0118256f73a29a2d6c06ea21fc48166ebf5acbcfaf57da3e173be7018e245338", "4424d7f653e29d731f95091d478816743c320fd7fa6a94f9bf8d4b2d7baf0975", ....
```

Fetching transaction 
```
$ curl http://localhost:8888/tx/5a002b39d70d0c3197afa1d2ae874083631f5a43cd4fe2b2cc35347d863f00f7
{"inputs": [{"previous_output": ["da03f16974423bf6425be37e7a6297587a35f117ce3b657e781eeff0098faed5", 0], "sequence": 4294967295, ....
```

address history 

```
$ curl http://localhost:8888/address/1dice3jkpTvevsohA4Np1yP4uKzG1SRLv
{ "history" : [{"spend_hash": "cdf6ea4f4590fbc847855cf68af181f1398b8997081cf0cfbd14e0f2cf2808ea", "output_height": 228180, "spend_index": 0, "value": 1000000, ....
```