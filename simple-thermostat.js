module.exports = function(RED) {
    function simpleThermostat(config) {
        RED.nodes.createNode(this,config);
        // Read in settings
        this.target = config.target;
        this.ifAbove = config.ifAbove;
        this.ifBelow = config.ifBelow;
        this.equal = config.equal;
        this.default = config.default;
        var node = this;
        
        // Input handling
        node.on('input', function(msg) {
            try {
                node.status({});
                var isValid = false;
                var currentValue = msg.payload;
                if ( isNaN(currentValue) || Array.isArray(currentValue)) {
                    isValid = false;
                    // Array of values - returned via influx query, for example:
                    // SELECT MEAN(value) FROM "My meaurement" WHERE time > now() - 2m`
                    if (Array.isArray(currentValue) ) {
                        try {
                            currentValue = currentValue[0].mean;
                            isValid = true;
                        } catch(e) {
                            //currentValue = 0;
                            isValid = false;
                            node.status({fill:"gray",shape:"dot",text:"No recent sensor readings"});
                        }
                    }
                } else {
                    // it's a number, yay!
                    isValid = true;
                }
                if (isValid) {
                    var target = "";
                    if ( msg.hasOwnProperty('target') ) {
                        target = msg.target;
                    } else {
                        target = node.target;
                    }
                    if ( isNaN(target) || target === "") {
                        isValid = false;
                        node.status({fill:"gray",shape:"dot",text:"Target must be a number"});
                    }
                }
                if (isValid) {
                    if (currentValue > target) {
                        node.status({text: `${currentValue.toFixed(2)} above ${target}`});
                        msg.payload = node.ifAbove;
                    } else if (currentValue < target){
                        node.status({text: `${currentValue.toFixed(2)} below ${target}`});
                        msg.payload = node.ifBelow;
                    } else if (currentValue == target) {
                        node.status({text: `Payload equal to ${target}`});
                        msg.payload = node.equal;
                    } else {
                        msg.payload = node.default;
                    }
                } else {
                    // Either no readings or msg.target was not a number
                    msg.payload = node.default;
                }
                // "" means return nothing
                if (msg.payload !== "") {
                    msg.currentValue = currentValue;
                    node.send(msg)
                }
            } catch (err) {
                node.status({fill:"gray",shape:"dot",text:err}); 
                node.warn(err);
            }
        });
    }
    RED.nodes.registerType("simple thermostat",simpleThermostat);
}
