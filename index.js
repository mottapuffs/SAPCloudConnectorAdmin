const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = 3000;
const https = require('https');
const bodyParser = require('body-parser')
const fs = require('fs');

//reading the Cloud connector details from a JSON file . This is used to populate the initial drop down
var detailsraw = fs.readFileSync("./__ccdetails", 'utf-8');
var details = JSON.parse(detailsraw);

//often times , cloud connector is in the green zone - so will have a self signed certificate or internal CA signed certificate. Turning SSL check off. The below line can be commented if 
//this is not needed
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

//app will listen on configured port
app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})

//all the static files  - HTML ,CSS placed in public folder
app.use(express.static('public'));
app.use(bodyParser.json());

//function to reread the config . This has been added so that whenever there is a new cloud connector added - it can take instant effect without having to restart the node program
async function rereadConfig() {
  var detailsraw = fs.readFileSync("./__ccdetails", 'utf-8');
  var details = JSON.parse(detailsraw);
  return details;
}

//This is the route that is executed when you click on tthe 'Get Details' button after selecting a cloud connector
app.post('/getProperties', async (request, response) => {
  try {

    //Lets reread the JSON file with all server details
    var details = await rereadConfig();
    
    //Lets search the index where the particular server is so that we can get the credentials for that index
    var index = await getIndex(request.body.value);

    //Now lets call the API to get details for the cloud connector
    const cccall = await fetch(request.body.value + '/api/v1/configuration/connector', {
      "method": "GET",
      "headers": {
        'Authorization': details[index].ccauth,
        "Content-Type": "application/json"
      },

    });
    const apicallresult = await cccall.json();
    response.json(apicallresult);
  }
  catch (error) {
    //Need to return the error in detail. This can be an additional feature in next iteration
    console.log('There was an error', error);
    response.json("{error}");
  }
});

//This is the route that is executed when the page is loaded. This gets the details of all cloud connectors that is populated in the drop down
app.get('/getCCDetails', async (request, response) => {

  var details = await rereadConfig();
  response.json(details);

});

//This is the route that is executed to check if HA is enabled
app.post('/getHAenabled', async (request, response) => {
  try{
  var details = await rereadConfig();
  var index = await getIndex(request.body.value);

  //calling the API
  const cccall = await fetch(request.body.value + '/api/v1/configuration/connector/ha/master/config', {
    "method": "GET",
    "headers": {
      'Authorization': details[index].ccauth,
      "Content-Type": "application/json"
    }

  });

  const apicallresult = await cccall.json();
  response.json(apicallresult);
}
catch (error) {
  //Need to return the error in detail. This can be an additional feature in next iteration
  console.log('There was an error', error);
  response.json("{error}");
}
});

//This is the route that is executed to get the HA state - i.e. READY, CONNECTED etc.
app.post('/getHAstate', async (request, response) => {
  try {
  var details = await rereadConfig();
  var index = await getIndex(request.body.value);

  //calling the API
  const cccall = await fetch(request.body.value + '/api/v1/configuration/connector/ha/master/state', {
    "method": "GET",
    "headers": {
      'Authorization': details[index].ccauth,
      "Content-Type": "application/json"
    }

  });

  const apicallresult = await cccall.json();
  response.json(apicallresult);
}
catch (error) {
  //Need to return the error in detail. This can be an additional feature in next iteration
  console.log('There was an error', error);
  response.json("{error}");
}
});

//This is the route that is executed to get the HA state for the Shadow cloud connector
app.post('/getShadowstate', async (request, response) => {

  try{
  var index = await getIndex(request.body.value);
  var details = await rereadConfig();
  
  const cccall = await fetch(request.body.value + '/api/v1/configuration/connector/ha/shadow/state', {
    "method": "GET",
    "headers": {
      'Authorization': details[index].ccauth,
      "Content-Type": "application/json"
    }

  });

  const apicallresult = await cccall.json();

  response.json(apicallresult);
}
catch (error) {
  //Need to return the error in detail. This can be an additional feature in next iteration
  console.log('There was an error', error);
  response.json("{error}");
}
});

//This is the route that is called to get the Master Host for a shadow system
app.post('/getMasterhost', async (request, response) => {
  try{
  var index = await getIndex(request.body.value);
  var details = await rereadConfig();

 
  const cccall = await fetch(request.body.value + '/api/v1/configuration/connector/ha/shadow/config', {
    "method": "GET",
    "headers": {
      'Authorization': details[index].ccauth,
      "Content-Type": "application/json"
    }

  });

  const apicallresult = await cccall.json();

  response.json(apicallresult);
}
catch (error) {
  //Need to return the error in detail. This can be an additional feature in next iteration
  console.log('There was an error', error);
  response.json("{error}");
}
});

//This is the route that is called when you add a new Cloud connector
app.post('/postCCDetails', async (request, response) => {
  try{
  var details = await rereadConfig();
  
  //The below 2 lines gets the data which is submitted in the require JSOn format
  jsonstring = JSON.stringify(request.body);
  jsonbody = JSON.parse(jsonstring);
 
  var serverlist = details;
  
  //Adding the new server details to the JSON file
  serverlist.push(jsonbody);

  stringjson = JSON.stringify(serverlist);

  //Write the file as __ccdetails. This file will now have the new server details as well
  fs.writeFileSync("./__ccdetails", stringjson, "utf-8", function (err) {
    if (err) {
      console.log("Some error in writing the file");
    }
    else {
      console.log("filewritten")
    }
  })

  response.json("{success}");
}
catch (error) {
  //Need to return the error in detail. This can be an additional feature in next iteration
  console.log('There was an error', error);
  response.json("{error}");
}

});

app.post('/getSAinfo', async (request, response) => {
try{
  var details = await rereadConfig();
  console.log("servername "+request.body.hostname);
  var index = await getIndex(request.body.hostname);
  console.log("Details :"+details);
  console.log("index :"+index);
  const SAinfo = await fetch(request.body.hostname + '/api/v1/configuration/subaccounts', {
    "method": "GET",
    "headers": {
      'Authorization': details[index].ccauth,
      "Content-Type": "application/json"
    }
  });
  
  const SAinfocallresult = await SAinfo.json();

  var noofservers = SAinfocallresult.length ;
  
  
  var jsonObj2 = new Array();

  for(i=0;i<noofservers;i++){
  var jsonObj1 = new Object();
  var regionhost = SAinfocallresult[i].regionHost ;
  var subaccount = SAinfocallresult[i].subaccount ;
  var locationid = SAinfocallresult[i].locationID ;
  
  const SAdetails = await fetch(request.body.hostname + '/api/v1/configuration/subaccounts/'+regionhost+'/'+subaccount , {
    "method": "GET",
    "headers": {
      'Authorization': details[index].ccauth,
      "Content-Type": "application/json"
    }
  });
  
  const SAdetailsresult = await SAdetails.json();

  var sastate = SAdetailsresult.tunnel.state;
  var validtill = SAdetailsresult.tunnel.subaccountCertificate.notAfterTimeStamp;
  var displayname = SAdetailsresult.displayName;
  console.log("STate "+sastate);
  console.log("validtill "+validtill);
  console.log("displayname "+displayname);

  
    jsonObj1.regionhost = regionhost;
    jsonObj1.subaccount = subaccount;
    jsonObj1.locationid = locationid;
    jsonObj1.state = sastate;
    jsonObj1.validtill = validtill;
    jsonObj1.displayname = displayname;
    
    jsonObj2.push(jsonObj1);
    console.log(jsonObj2) ;
  }
    jsonstring = JSON.stringify(jsonObj2);
    console.log(jsonstring);
    response.json(jsonstring);
}
catch (error) {
  //Need to return the error in detail. This can be an additional feature in next iteration
  console.log('There was an error', error);
  response.json("{error}");
}
});

app.post('/getSystemMapping', async (request, response) => {

  try{
    var details = await rereadConfig();

    var index = await getIndex(request.body.hostname);

    var regionhost = request.body.regionhost;
    var subaccount = request.body.subaccount ;
    const mappinginfo = await fetch(request.body.hostname + '/api/v1/configuration/subaccounts/'+regionhost+'/'+subaccount+'/systemMappings', {
      "method": "GET",
      "headers": {
        'Authorization': details[index].ccauth,
        "Content-Type": "application/json"
      }
    });

    const mappingresult = await mappinginfo.json();
    console.log(mappingresult)
    response.json(mappingresult);

  }
  catch(error){
  //Need to return the error in detail. This can be an additional feature in next iteration
  console.log('There was an error', error);
  response.json("{error}");
  }
  
});

//The below is a function to search index for any particular cloud connector 
async function getIndex(ccserversearch) {
  var details = await rereadConfig();;
  var index = -1;
  var filterme = details.find(function (item, i) {
    if (item.ccserver === ccserversearch) {
      index = i;

    }


  });
  return index;

}