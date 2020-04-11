var should = require("should");
var helper = require("node-red-node-test-helper");
var thermostat = require("../simple-thermostat.js");
helper.init(require.resolve('node-red'));

describe('simple thermostat Node', function () {

  afterEach(function () {
    helper.unload();
  });

  it('should be loaded', function (done) {
    var flow = [{ id: "n1", type: "simple thermostat", name: "test name" }];
    helper.load(thermostat, flow, function () {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'test name');
      done();
    });
  });

  it('should return off if greater than msg.payload and return the original payload as msg.currentValue', function (done) {
    var flow = [
        { id: "n1", type: "simple thermostat", name: "turn off if above 5", ifAbove: "off", target: 5, wires:[["n2"]] },
        { id: "n2", type: "helper" }
    ];
    helper.load(thermostat, flow, function () {
        var n2 = helper.getNode("n2");
        var n1 = helper.getNode("n1");
        n2.on("input", function (msg) {
          msg.should.have.property('payload', 'off');
          msg.should.have.property('currentValue', 6);
          done();
        });
        n1.receive({ payload: 6 });
    });
  });

  it('should allow overriding with msg.target', function (done) {
    var flow = [
        { id: "n1", type: "simple thermostat", name: "target will be overridden", ifAbove: "off", ifBelow: "on", target: 10, wires:[["n2"]] },
        { id: "n2", type: "helper" }
    ];
    helper.load(thermostat, flow, function () {
        var n2 = helper.getNode("n2");
        var n1 = helper.getNode("n1");
        n2.on("input", function (msg) {
          msg.should.have.property('payload', 'off');
          done();
        });
        n1.receive({ payload: 8, target: 5 });
    });
  });

  it('should allow use of influxdb mean format output and return currentValue', function (done) {
    var flow = [
        { id: "n1", type: "simple thermostat", name: "turn off if above 5", ifAbove: "off", target: 5, wires:[["n2"]] },
        { id: "n2", type: "helper" }
    ];
    helper.load(thermostat, flow, function () {
        var n2 = helper.getNode("n2");
        var n1 = helper.getNode("n1");
        n2.on("input", function (msg) {
          msg.should.have.property('payload', 'off');
          msg.should.have.property('currentValue', 6);
          done();
        });
        n1.receive({ payload: [{'mean': 6}]});
    });
  });

  it('should return a default value there are no recent readings from influx', function (done) {
    var flow = [
        { id: "n1", type: "simple thermostat", name: "turn off if above 5", ifAbove: "off", target: 5, default: "default payload", wires:[["n2"]] },
        { id: "n2", type: "helper" }
    ];
    helper.load(thermostat, flow, function () {
        var n2 = helper.getNode("n2");
        var n1 = helper.getNode("n1");
        n2.on("input", function (msg) {
          msg.should.have.property('payload', 'default payload');
          done();
        });
        n1.receive({ payload: []}); // If there are no readings, Influx returns an empty array as the payload
    });
  });

  it('should return a default value if the payload can\'t be parsed', function (done) {
    var flow = [
        { id: "n1", type: "simple thermostat", name: "turn off if above 5", ifAbove: "off", target: 5, default: "default payload", wires:[["n2"]] },
        { id: "n2", type: "helper" }
    ];
    helper.load(thermostat, flow, function () {
        var n2 = helper.getNode("n2");
        var n1 = helper.getNode("n1");
        n2.on("input", function (msg) {
          msg.should.have.property('payload', 'default payload');
          done();
        });
        n1.receive({ payload: 'invalid'});
    });
  });

  it('should return a default value if target not set', function (done) {
    var flow = [
        { id: "n1", type: "simple thermostat", name: "turn off if above 5", ifEqual: "off", target: "", default: "default payload", wires:[["n2"]] },
        { id: "n2", type: "helper" }
    ];
    helper.load(thermostat, flow, function () {
        var n2 = helper.getNode("n2");
        var n1 = helper.getNode("n1");
        n2.on("input", function (msg) {
          msg.should.have.property('payload', 'default payload');
          done();
        });
        n1.receive({ payload: 0});
    });
  });

});
