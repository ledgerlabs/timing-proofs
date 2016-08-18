if (typeof web3 !== 'undefined') {
	web3 = new Web3(web3.currentProvider);
} else {
    // set the provider you want from Web3.providers
    web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

var reader = new FileReader();
var file;
var toBeHashed = '';
var EtherProofAPI = [{"constant":true,"inputs":[{"name":"hash","type":"bytes32"}],"name":"getBlockNumber","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"hash","type":"bytes32"}],"name":"addFile","outputs":[],"type":"function"},{"constant":true,"inputs":[{"name":"hash","type":"bytes32"}],"name":"getTimestamp","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[{"name":"hash","type":"bytes32"}],"name":"checkExistence","outputs":[{"name":"","type":"bool"}],"type":"function"}];
// Need to get a permanent address once deployed on main net
var address = '0xd49bc1cc5a80835b0a70875f9594204d6dd5a0dc';
var EtherProof = web3.eth.contract(EtherProofAPI).at(address);

$(function () {
    var dropZoneId = "drop-zone";
    var buttonId = "clickHere";
    var mouseOverClass = "mouse-over";

    var dropZone = $("#" + dropZoneId);
    var ooleft = dropZone.offset().left;
    var ooright = dropZone.outerWidth() + ooleft;
    var ootop = dropZone.offset().top;
    var oobottom = dropZone.outerHeight() + ootop;
    var inputFile = dropZone.find("input");
    document.getElementById(dropZoneId).addEventListener("dragover", function (e) {
        e.preventDefault();
        e.stopPropagation();
        dropZone.addClass(mouseOverClass);
        var x = e.pageX;
        var y = e.pageY;

        if (!(x < ooleft || x > ooright || y < ootop || y > oobottom)) {
            inputFile.offset({ top: y - 15, left: x - 100 });
        } else {
            inputFile.offset({ top: -400, left: -400 });
        }

    }, true);

    if (buttonId != "") {
        var clickZone = $("#" + buttonId);

        var oleft = clickZone.offset().left;
        var oright = clickZone.outerWidth() + oleft;
        var otop = clickZone.offset().top;
        var obottom = clickZone.outerHeight() + otop;

        $("#" + buttonId).mousemove(function (e) {
            var x = e.pageX;
            var y = e.pageY;
            if (!(x < oleft || x > oright || y < otop || y > obottom)) {
                inputFile.offset({ top: y - 15, left: x - 160 });
            } else {
                inputFile.offset({ top: -400, left: -400 });
            }
        });
    }

    document.getElementById(dropZoneId).addEventListener("drop", function (e) {
        $("#" + dropZoneId).removeClass(mouseOverClass);
    }, true);

})

document.getElementById('file').addEventListener('change', load, true);

document.getElementById('file').onchange = function() {
	var name = this.value;
	name = name.split("\\");
	name = name[name.length - 1];
	document.getElementById('chosenFile').textContent = name;
	document.getElementById('hash').textContent = '';
	document.getElementById('existence').textContent = '';
	document.getElementById('register').style.display = 'none';
	loop();
}

function load() {
	file = document.getElementById('file').files[0];
	reader.onloadend = function(evt) {
		if (evt.target.readyState == FileReader.DONE) {
			var result = evt.target.result;
			toBeHashed = result;
		}
		document.getElementById('hash').textContent = 'Keccak-256 hash of file: ' + web3.sha3(toBeHashed);
		existence();
	}
}

function loop() {
	if (!file) {
		alert('Please select a file!');
		return;
	}
	reader.readAsBinaryString(file);
}

function existence() {
	var hash = document.getElementById('hash').textContent.slice(-66);
	var existence = document.getElementById('existence');
	if (hash.length != 66) {
		existence.innerHTML = '<h2> Pick a file and generate a hash first </h2>';
		document.getElementById('register').style.display = 'none';
	} else if (!EtherProof.checkExistence(hash)) {
		existence.innerHTML = '<h2> This File Does Not Exist </h2>';
		existence.innerHTML += 'Register Your File Now for 100 000 wei';
		existence.innerHTML += '<br>';
		document.getElementById('register').style.display = 'block';
	} else {
		document.getElementById('register').style.display = 'none';
		existence.innerHTML = '<h2> This File Exists </h2>';
		existence.innerHTML += '<p> Timestamp: ' + new Date(EtherProof.getTimestamp(hash) * 1000) + '</p>' +
			'<p> Block Number: ' + EtherProof.getBlockNumber(hash) + '</p>';
	}
}

function register(form) {
	document.getElementById('existence').innerHTML = '';
	document.getElementById('register').style.display = 'none';
        EtherProof.addFile.sendTransaction(
                web3.sha3(toBeHashed),
                {
                        from: web3.eth.accounts[$('#accounts').val()],
                        value: 100000,
                        gas: 4700000
                }, function (error, result) {
                        if (error) {
                                console.log(error);
                        }
                        var txhash = result;
                        var filter = web3.eth.filter('latest');
                        filter.watch(function (error, result) {
                                if (error) {
                                        console.log(error);
                                }
                                var receipt = web3.eth.getTransactionReceipt(txhash);
                                if (receipt && receipt.transactionHash == txhash) {
                                        alert("Your transaction has been mined!");
					if (localStorage.getItem('recentHashes')) {
						
					}
                                        var r = JSON.parse(localStorage.getItem('recentHashes'));
					var length = r.length;
					if (length < 5) {
						r[length] = web3.sha3(toBeHashed);
					} else {
						r[5] = web3.sha3(toBeHashed);
						for (var i = 0; i < 5; ++i) {
							r[i] = r[i + 1];
						}
					}
					localStorage.setItem('recentHashes', JSON.stringify(r));
					updateTable();
					filter.stopWatching();
                                }
                        });
                }
        );
}

function updateTable() {
	var hashTable = document.getElementById('recentHashes');
	var numRows = hashTable.rows.length;
	for (var i = 1; i < numRows; ++i) {
		hashTable.deleteRow(1);
	}
	var length = JSON.parse(localStorage.getItem('recentHashes')).length;
	if (length > 5) {
		length = 5;
	}
	for (var j = 0; j < length; ++j) {
		var row = hashTable.insertRow(1);
		var newHash = row.insertCell(0);
		var newTimestamp = row.insertCell(1);
		var newBlockNumber = row.insertCell(2);
		newHash.innerHTML = JSON.parse(localStorage.getItem('recentHashes'))[j];
		newTimestamp.innerHTML = new Date(EtherProof.getTimestamp(newHash.innerHTML) * 1000);
		newBlockNumber.innerHTML = EtherProof.getBlockNumber(newHash.innerHTML).toString();
	}
}

function search(form) {
	var hash = form.searchHash.value;
	var searchResult = document.getElementById('searchResult');
	if (!EtherProof.checkExistence(hash)) {
		searchResult.innerHTML = '<h2> This File Does Not Exist </h2>';
	} else {
		searchResult.innerHTML = '<h2> This File Exists </h2>';
		searchResult.innerHTML += '<p> Timestamp: ' + new Date(EtherProof.getTimestamp(hash) * 1000) + '</p>' +
			'<p> Block Number: ' + EtherProof.getBlockNumber(hash) + '</p>';
	}
}

$(document).ready(function() {
        for (var i = 0; i < web3.eth.accounts.length; ++i) {
                $('#accounts').append("<option value=\"" + i + "\">" + web3.eth.accounts[i] + "</option>");
        }
	updateTable();
});
