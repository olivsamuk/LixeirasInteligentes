/*******************************************************************************
 * Copyright (c) 2015 IBM Corp.
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * and Eclipse Distribution License v1.0 which accompany this distribution.
 *
 * The Eclipse Public License is available at
 *    http://www.eclipse.org/legal/epl-v10.html
 * and the Eclipse Distribution License is available at
 *   http://www.eclipse.org/org/documents/edl-v10.php.
 *
 * Contributors:
 *    James Sutton - Initial Contribution
 *******************************************************************************/

/*
Eclipse Paho MQTT-JS Utility
This utility can be used to test the Eclipse Paho MQTT Javascript client.
*/

// Create a client instance
client = null;

connected = false;

// called when the client connects
function onConnect(context) {
  // Once a connection has been made, make a subscription and send a message.
  console.log("Client Connected");
  var statusSpan = document.getElementById("connectionStatus");
  statusSpan.innerHTML = "Conectado a: " + context.invocationContext.host + ':' + context.invocationContext.port + context.invocationContext.path + ' as ' + context.invocationContext.clientId;
  connected = true;
  setFormEnabledState(true);

}

function onFail(context) {
  console.log("Failed to connect");
  var statusSpan = document.getElementById("connectionStatus");
  statusSpan.innerHTML = "Failed to connect: " + context.errorMessage;
  connected = false;
  setFormEnabledState(false);    
}

// called when the client loses its connection
function onConnectionLost(responseObject) {
  if (responseObject.errorCode !== 0) {
    console.log("Connection Lost: " + responseObject.errorMessage);
  }
  connected = false;
}

function getLevel(value) {
  //Start with assuming shelf empty
  l1=0;
  l2=0;
  l3=0;
  l4=0;
  l5=0;
  var newValue = (Number(value));

  if (newValue <= 3 ) {
    l1=5;
  }

    if (newValue <= 5 ) {
    l2=20;
  }

  if (newValue <= 10 ) {
    l3=25;
  }

  if (newValue <= 14 ) {
    l4=25;
  }

  if (newValue <= 17 ) {
    l5=5;
  }

  if (newValue>=18) {
    return 0;
  }else{
    var sum = l1 + l2 + l3 + l4+l5;
    return sum;  
  }
  
}

// called when a message arrives
function onMessageArrived(message) {
  console.log('Message Recieved: Topic: ', message.destinationName, '. Payload: ', message.payloadString, '. QoS: ', message.qos);
  console.log(message);
  var messageTime = new Date().toISOString();
  // Insert into History Table
  var table = document.getElementById("incomingMessageTable").getElementsByTagName('tbody')[0];
  var row = table.insertRow(0);
  row.insertCell(0).innerHTML = message.destinationName;
  row.insertCell(1).innerHTML = '<b>' + safe_tags_regex(message.payloadString) + '</b>';
  row.insertCell(2).innerHTML = messageTime;
  row.insertCell(3).innerHTML = message.qos;


  if(!document.getElementById(message.destinationName)){
      var lastMessageTable = document.getElementById("lastMessageTable").getElementsByTagName('tbody')[0];
      var newlastMessageRow = lastMessageTable.insertRow(0);
      newlastMessageRow.id = message.destinationName;
      newlastMessageRow.insertCell(0).innerHTML = message.destinationName;
      newlastMessageRow.insertCell(1).innerHTML = safe_tags_regex(message.payloadString);
      newlastMessageRow.insertCell(2).innerHTML = messageTime;
      newlastMessageRow.insertCell(3).innerHTML = message.qos;

  } else {
      // Update Last Message Table

      var lastMessageRow = document.getElementById(message.destinationName);
      lastMessageRow.id = message.destinationName;
      lastMessageRow.cells[0].innerHTML = message.destinationName;
      lastMessageRow.cells[1].innerHTML = "<div class='progress'><div class='progress-bar progress-bar-striped active' role='progressbar' aria-valuenow='"+ getLevel(safe_tags_regex(message.payloadString)) + "' aria-valuemin='0' aria-valuemax=100' style='width: " + getLevel(safe_tags_regex(message.payloadString)) + "%'><span class='sr-only'>" + getLevel(safe_tags_regex(message.payloadString)) + "% Complete</span></div></div>" ;
      lastMessageRow.cells[2].innerHTML = getLevel(safe_tags_regex(message.payloadString)) + " %"; 
      lastMessageRow.cells[3].innerHTML = messageTime;
  }

}

function connectionToggle(){

  if(connected){
    disconnect();
  } else {
    connect();
  }


}


function connect(){
    var hostname = document.getElementById("hostInput").value;
    var port = document.getElementById("portInput").value;
    var clientId = document.getElementById("clientIdInput").value;

    var path = document.getElementById("pathInput").value;
    var user = document.getElementById("userInput").value;
    var pass = document.getElementById("passInput").value;
    var keepAlive = Number(document.getElementById("keepAliveInput").value);
    var timeout = Number(document.getElementById("timeoutInput").value);
    var ssl = document.getElementById("sslInput").checked;
    var cleanSession = document.getElementById("cleanSessionInput").checked;
    var lastWillTopic = document.getElementById("lwtInput").value;
    var lastWillQos = Number(document.getElementById("lwQosInput").value);
    var lastWillRetain = document.getElementById("lwRetainInput").checked;
    var lastWillMessage = document.getElementById("lwMInput").value;


    if(path.length > 0){
      client = new Paho.MQTT.Client(hostname, Number(port), path, clientId);
    } else {
      client = new Paho.MQTT.Client(hostname, Number(port), clientId);
    }
    console.info('Connecting to Server: Hostname: ', hostname, '. Port: ', port, '. Path: ', client.path, '. Client ID: ', clientId);

    // set callback handlers
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;


    var options = {
      invocationContext: {host : hostname, port: port, path: client.path, clientId: clientId},
      timeout: timeout,
      keepAliveInterval:keepAlive,
      cleanSession: cleanSession,
      useSSL: ssl,
      onSuccess: onConnect,
      onFailure: onFail
    };



    if(user.length > 0){
      options.userName = user;
    }

    if(pass.length > 0){
      options.password = pass;
    }

    if(lastWillTopic.length > 0){
      var lastWillMessage = new Paho.MQTT.Message(lastWillMessage);
      lastWillMessage.destinationName = lastWillTopic;
      lastWillMessage.qos = lastWillQos;
      lastWillMessage.retained = lastWillRetain;
      options.willMessage = lastWillMessage;
    }

    // connect the client
    client.connect(options);
    var statusSpan = document.getElementById("connectionStatus");
    statusSpan.innerHTML = 'Conectando...';
}

function disconnect(){
    console.info('Disconnecting from Server');
    client.disconnect();
    var statusSpan = document.getElementById("connectionStatus");
    statusSpan.innerHTML = 'Conexão - Desconectado.';
    connected = false;
    setFormEnabledState(false);

}

// Sets various form controls to either enabled or disabled
function setFormEnabledState(enabled){

    // Connection Panel Elements
    if(enabled){
      document.getElementById("clientConnectButton").innerHTML = "Desconectar";
    } else {
      document.getElementById("clientConnectButton").innerHTML = "Conectar";
    }
    document.getElementById("hostInput").disabled = enabled;
    document.getElementById("portInput").disabled = enabled;
    document.getElementById("clientIdInput").disabled = enabled;
    document.getElementById("pathInput").disabled = enabled;
    document.getElementById("userInput").disabled = enabled;
    document.getElementById("passInput").disabled = enabled;
    document.getElementById("keepAliveInput").disabled = enabled;
    document.getElementById("timeoutInput").disabled = enabled;
    document.getElementById("sslInput").disabled = enabled;
    document.getElementById("cleanSessionInput").disabled = enabled;
    document.getElementById("lwtInput").disabled = enabled;
    document.getElementById("lwQosInput").disabled = enabled;
    document.getElementById("lwRetainInput").disabled = enabled;
    document.getElementById("lwMInput").disabled = enabled;

    // Publish Panel Elements
    document.getElementById("publishTopicInput").disabled = !enabled;
    document.getElementById("publishQosInput").disabled = !enabled;
    document.getElementById("publishMessageInput").disabled = !enabled;
    document.getElementById("publishButton").disabled = !enabled;
    document.getElementById("publishRetainInput").disabled = !enabled;

    // Subscription Panel Elements
    document.getElementById("subscribeTopicInput").disabled = !enabled;
    document.getElementById("subscribeQosInput").disabled = !enabled;
    document.getElementById("subscribeButton").disabled = !enabled;
    document.getElementById("unsubscribeButton").disabled = !enabled;

}

function publish(){
    var topic = document.getElementById("publishTopicInput").value;
    var qos = document.getElementById("publishQosInput").value;
    var message = document.getElementById("publishMessageInput").value;
    var retain = document.getElementById("publishRetainInput").checked
    console.info('Publishing Message: Topic: ', topic, '. QoS: ' + qos + '. Message: ', message);
    message = new Paho.MQTT.Message(message);
    message.destinationName = topic;
    message.qos = Number(qos);
    message.retained = retain;
    client.send(message);
}


function subscribe(){
    var topic = document.getElementById("subscribeTopicInput").value;
    var qos = document.getElementById("subscribeQosInput").value;
    console.info('Subscribing to: Topic: ', topic, '. QoS: ', qos);
    client.subscribe(topic, {qos: Number(qos)});
}

function unsubscribe(){
    var topic = document.getElementById("subscribeTopicInput").value;
    console.info('Unsubscribing from ', topic);
    client.unsubscribe(topic, {
         onSuccess: unsubscribeSuccess,
         onFailure: unsubscribeFailure,
         invocationContext: {topic : topic}
     });
}


function unsubscribeSuccess(context){
    console.info('Successfully unsubscribed from ', context.invocationContext.topic);
}

function unsubscribeFailure(context){
    console.info('Failed to  unsubscribe from ', context.invocationContext.topic);
}

function clearHistory(){
    var table = document.getElementById("incomingMessageTable");
    //or use :  var table = document.all.tableid;
    for(var i = table.rows.length - 1; i > 0; i--)
    {
        table.deleteRow(i);
    }

}


// Just in case someone sends html
function safe_tags_regex(str) {
   return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
