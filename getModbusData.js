var ModbusRTU = require("modbus-serial");
const collectAndPush = require("./collectAndPush")
const TB = require('thingsboard_api')
const config = require('dotenv').config();
/*var machines = [
    {ip: "83.234.93.121", port: 10501, id: 10501, machineType: ''},
    {ip: "83.234.93.121", port: 10502, id: 10502},
    {ip: "83.234.93.121", port: 10503, id: 10503},
    {ip: "83.234.93.121", port: 10504, id: 10504},
    {ip: "83.234.93.121", port: 10505, id: 10505},
    {ip: "83.234.93.121", port: 10506, id: 10506},
    ]

 */
// name || TB_id
async function main(){
    let options = {
        TB_HOST: config.parsed.TB_HOST,
        TB_PORT: config.parsed.TB_PORT,
        TB_USERNAME: config.parsed.TB_USERNAME,
        TB_PASSWORD: config.parsed.TB_PASSWORD,
    }

    await TB.createConnection(options);
    let keys = ['ip','port','machineType']
    var machines = await  TB.get.allObjectsIDandKeysByType('machine','device',keys)
    var ourMachines = []
    for(let i=0; i<machines.length;i++){
        if (typeof machines[i].ip !== 'undefined' && typeof machines[i].port !== 'undefined' ) {
            machines[i].deviceID = await TB.get.getDeviceToken(machines[i].id)
            ourMachines.push(machines[i]);
        }
    }
    getModbusData(ourMachines)
}



main()



function getModbusData(machines) {
    clients = []
    machineData = {}
    for (let i = 0; i < machines.length; i++) {
        clients[i] = {
            client: new ModbusRTU(),
            ip: machines[i].ip,
            port: machines[i].port,
            id: machines[i].id,
            // name || TB_id
        };
        machineData[machines[i].id] = { name: machines[i].name, deviceID: machines[i].deviceID }
        clients[i].client.connectTCP(machines[i].ip, {port: machines[i].port})
        clients[i].client.setID(i);
    }

    //Read machine data
    setInterval(function () {
        for (let i = 0; i < clients.length; i++) {
            //la
            clients[i].client.readHoldingRegisters(6, 2, function (err, data) {
                try {
                    machineData[clients[i].id].la = currentToFloat(data.data)
                    machineData[clients[i].id].lastUpdate = new Date().getTime();
                } catch (e) {
                }
            });

            //lb
            clients[i].client.readHoldingRegisters(8, 2, function (err, data) {
                try {
                    machineData[clients[i].id].lb = currentToFloat(data.data)
                    machineData[clients[i].id].lastUpdate = new Date().getTime();
                } catch (e) {
                }
            });

            //lc
            clients[i].client.readHoldingRegisters(0x0A, 2, function (err, data) {
                try {
                    machineData[clients[i].id].lc = currentToFloat(data.data)
                    machineData[clients[i].id].lastUpdate = new Date().getTime();
                } catch (e) {
                }
            });

            //input
            clients[i].client.readHoldingRegisters(0x8000, 2, function (err, data) {
                try {
                    machineData[clients[i].id].input = data.data
                    machineData[clients[i].id].lastUpdate = new Date().getTime();
                } catch (e) {
                }
            });

            //output
            clients[i].client.readHoldingRegisters(0xA000, 2, function (err, data) {
                try {
                    machineData[clients[i].id].output = data.data
                    machineData[clients[i].id].lastUpdate = new Date().getTime();
                } catch (e) {
                }
            });
        }
    }, 1000);
}

//Collected machine data
setInterval(function () {
    if(typeof machineData !='undefined')
        collectAndPush.collectParseData(machineData)
}, 1000)


//Current array from modbus to float
function currentToFloat(currentArr){
    let stringValue = currentArr[0] + (currentArr[1]<<16);
    return toFloat(stringValue);
}

function toFloat (n) {
    var sign = (n >> 31) * 2 + 1; // +1 or -1.
    var exp = (n >>> 23) & 0xff;
    var mantissa = n & 0x007fffff;
    if (exp === 0xff) {
        // NaN or Infinity
        return mantissa ? NaN : sign * Infinity;


    }
    else if (exp) {
        // Normalized value
        exp -= 127;

        // Add implicit bit in normal mode.
        mantissa |= 0x00800000;
    }
    else {
        // Subnormal number
        exp = -126;
    }
    return sign * mantissa * Math.pow(2, exp - 23);
}


