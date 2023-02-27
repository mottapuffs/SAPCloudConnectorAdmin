
//Call function to load the list of Cloud connectors into the dropdown on loading of the page
getccdetails();
var sadetailsrespjson ;
//initializing some variables which are used repetitively in many functions
var resptab = document.getElementById("resptable");
var tblhdr = document.getElementById("heading");
var cctab = document.getElementById("cctable");
var btndetails = document.getElementById("getProperties");

//Listen for button click on the 'Get Details' Button
document.querySelector('#getProperties').addEventListener('click',() =>{   
    if(document.getElementById("CCName").value=="Select a Cloud connector")
    {
      console.log("inside if loop");
      alert("Please select a cloud connector or Add a new one using the Add CC option");
    }
    else {
      //call function getccresponse to check status of the selected Cloud connector system
    getccresponse(document.getElementById("CCName").value);
    }
}) 

//This function checks the status of the cloud connector- if its running, HA is enabled and so on
async function getccresponse(value){

  var satable = document.getElementById("SAtable");
var saheader = document.getElementById("SAheader")
var maptable = document.getElementById("maptable");
var mapheader = document.getElementById("mapheader")
  //making the table element which shows status of cloud connector visible
    //gg - var resptab = document.getElementById("resptable");
    resptab.classList.remove('cctablevisible');
    satable.classList.remove('cctablevisible');
    saheader.classList.remove('cctablevisible');
    maptable.classList.remove('cctablevisible');
    mapheader.classList.remove('cctablevisible');
    //Lets get the status of the CC server . Call to backend node program 
    const response = await fetch('/getProperties',{
          method: 'POST',
          body: JSON.stringify({value}) ,
          headers: { 'Content-Type': 'application/json' }

    }) ;
    const data = await response.json() ;
    var firstbtn = document.getElementById("firstbtn");
    var sabtn = document.getElementById("sabtn");
    const ccname = document.getElementsByName("CCName")[0];
    
    //if there is an error with retrieiving status of cloud connector , the labels will be accordingly marked
    if(data=="{error}"){
      document.querySelector('.tlabel1').innerHTML='<a href="'+ccname.value+'"target="_blank">'+ccname.value+'</a>';
      document.querySelector('#testlabel3').textContent="Not Reachable" ;
      //Make the 'More info' button invisible in case of error
      firstbtn.classList.add('firstbtninvisble');
      sabtn.classList.add('firstbtninvisble');
    }
    else{
      //if the data is retrieved successfully, populate the fields accordingly
    firstbtn.classList.remove('firstbtninvisble');
    sabtn.classList.remove('firstbtninvisble');
    //document.querySelector('#testlabel1').textContent=ccname.value ;
    document.querySelector('.tlabel1').innerHTML='<a href="'+ccname.value+'"target="_blank">'+ccname.value+'</a>';
    document.querySelector('#testlabel2').textContent=data.description ;
    document.querySelector('#testlabel3').textContent="Running" ;
    document.querySelector('#harole').textContent=data.ha.role ;
    }
    
    //make the required elements visible
    // gg var tblhdr = document.getElementById("heading");
    // gg var cctab = document.getElementById("cctable");
    tblhdr.classList.add('cctablevisible')
    cctab.classList.add('cctablevisible')
    
    
}

//This function populates the initial dropdown
async function getccdetails(){
    const response = await fetch('/getCCDetails') ;
    const data = await response.json();
    const noofservers = data.length ;
    // gg var btndetails = document.getElementById("getProperties");
    
    if(noofservers<2) {
      btndetails.classList.add('firstbtninvisble');
    }

for (let i=0; i<noofservers;i++){
  console.log("inside for loop");
    document.querySelector('#CCName').insertAdjacentHTML('beforeend',`<option value="${data[i].ccserver}">${data[i].ccname}</option>`);
}

}

//This function is called when the 'More info' button is clicked
async function btnFunction(){
  var satable = document.getElementById("SAtable");
var saheader = document.getElementById("SAheader")
var maptable = document.getElementById("maptable");
var mapheader = document.getElementById("mapheader")
    //some bad code to make elements visible/invisble . i am a HTML/CSS noob
    //gg var resptab = document.getElementById("resptable");
    resptab.classList.add('cctablevisible');
    satable.classList.remove('cctablevisible');
    saheader.classList.remove('cctablevisible');
    maptable.classList.remove('cctablevisible');
    mapheader.classList.remove('cctablevisible');
    const value = document.querySelector('#testlabel1').textContent ;
    
    //if the server for which 'more info' is clicked is a master called the below route which calls the required API for master
    if(document.querySelector('#harole').textContent=="master"){
          const hatrue = await fetch('/getHAenabled',{
            method:'POST',
            body: JSON.stringify({value}) ,
            headers: { 'Content-Type': 'application/json' }
          }) ;

          const hadata = await hatrue.json();
          console.log(hadata);
         if(hadata =="{error}"){
          console.log("inside error block")
          document.querySelector('#haconfigured').textContent = "Error fetching data"
          document.querySelector('#hastatus').textContent="Error fetching data"
          document.querySelector('#shadowmasterhost').textContent="Error fetching data"
         }
          else {
          document.querySelector('#haconfigured').textContent=hadata.haEnabled ;
          }
          //if the server is a master and HA is configured run the below
          if(hadata.haEnabled){
            const hastate = await fetch('/getHAstate',{
                method:'POST',
                body: JSON.stringify({value}) ,
                headers: { 'Content-Type': 'application/json' }
              }) ;
    
              const hastatedata = await hastate.json();

              if(hastatedata=="{error}"){
                document.querySelector('#hastatus').textContent = "Error fetching data";
                document.querySelector('#shadowmasterhost').textContent="Error fetching data" ;
              }
              else {
              document.querySelector('#hastatus').textContent=hastatedata.state ;

              document.querySelector('#shadowmasterheader').textContent="Shadow Host" ;
              document.querySelector('#shadowmasterhost').textContent=hastatedata.shadowHost ;
              }
          }
          else if(!hadata.haEnabled){
            console.log("in else loop: "+hadata.haEnabled)
            document.querySelector('#hastatus').textContent="N/A"
            document.querySelector('#shadowmasterhost').textContent="N/A"
          }

    }
    //Execute the below if the server is a shadow
    if(document.querySelector('#harole').textContent=="shadow"){

        const shadowconfig = await fetch('/getShadowstate',{
            method:'POST',
            body: JSON.stringify({value}) ,
            headers: { 'Content-Type': 'application/json' }
          }) ;

          const shddata = await shadowconfig.json();

          if(shddata === "{error}"){
            document.querySelector('#haconfigured').textContent = "Error fetching data"
            document.querySelector('#hastatus').textContent="Error fetching data"
            
           }
            else {
              document.querySelector('#hastatus').textContent=shddata.state ;
            }

          

          const masterhost = await fetch('/getMasterhost',{
            method:'POST',
            body: JSON.stringify({value}) ,
            headers: { 'Content-Type': 'application/json' }
          }) ;

          const masterhostdata = await masterhost.json();
          
          if(masterhostdata=="{error}"){
            document.querySelector('#haconfigured').textContent="Error fetching data";
          document.querySelector('#shadowmasterheader').textContent="Master Host" ;
          document.querySelector('#shadowmasterhost').textContent="Error fetching data" ;

          }
          else {
          document.querySelector('#haconfigured').textContent="true";
          document.querySelector('#shadowmasterheader').textContent="Master Host" ;
          document.querySelector('#shadowmasterhost').textContent=masterhostdata.masterHost ;

          }
          

    }

}

//what happens when you click the Home button
async function btnHome(){
  location.reload();
}

//This is what happens when you click the addCC button
async function btnaddrem(){
  var satable = document.getElementById("SAtable");
var saheader = document.getElementById("SAheader")
var maptable = document.getElementById("maptable");
var mapheader = document.getElementById("mapheader")
var tbcontainer = document.getElementById("tablecontainer");

tbcontainer.classList.add('tablecontaineradjust');
cctab.classList.add('tablecontaineradjust');

  satable.classList.remove('cctablevisible');
  saheader.classList.remove('cctablevisible');
  maptable.classList.remove('cctablevisible');
  mapheader.classList.remove('cctablevisible');
  //More bad code to make elements visible/invisible . 
  var ccbody = document.getElementById("ccbody");
  
  document.querySelector("#validate").textContent="Please enter details for the system and click on Submit"
  // gg var btndetails = document.getElementById("getProperties");
  btndetails.classList.add('firstbtninvisble');
  var formclass = document.getElementById("ccformclass");
  ccbody.classList.add('firstbtninvisble');
  
  formclass.classList.add('cctablevisible');
  //gg var cctab = document.getElementById("cctable");
  cctab.classList.remove('cctablevisible')
  //gg var tblhdr = document.getElementById("heading");
  tblhdr.classList.remove('cctablevisible');
  // gg var resptab = document.getElementById("resptable");
  resptab.classList.remove('cctablevisible')
  
}

//This is what happens when you click on the submit button post 
async function ccSubmit(){
  
  //very basic validation for the URL.it should be in the format https://servername:port or http://servername:port
  let urlstring = document.getElementById("ccserver").value;

  const myArray=urlstring.split(":");
  //console.log(document.getElementById("validate").innerText);
  if(myArray.length != 3){
    console.log("inside array length "+myArray.length);
    document.querySelector('#validate').textContent="not a valid URL" ;
  }
  
  else if(myArray[0] !== "http" &&  myArray[0] !== "HTTP" && myArray[0] !== "https" && myArray[0] !== "HTTPS"  ){
    document.querySelector('#validate').textContent="not a valid URL" ;
  }
  else if(myArray[2].length>5){
    document.querySelector('#validate').textContent="not a valid URL" ;
  }

  else{
    
    //hashing the credentials
    phash = document.getElementById("username").value +":"+ document.getElementById("password").value ;
    
    phashb = btoa(phash) ;
    console.log(phashb);

    //creating a json object to send to the backend with required info
    var jsonObj1 = new Object();
    jsonObj1.ccserver = document.getElementById("ccserver").value;
    jsonObj1.ccauth = "Basic "+phashb;
    jsonObj1.ccname = document.getElementById("ccdisname").value;

    jsonstring = JSON.stringify(jsonObj1);
    
    //call backend
    const addccresp = await fetch('/postCCDetails',{
      method:'POST',
      body: jsonstring ,
      headers: { 'Content-Type': 'application/json' }
    }) ;
    
    
    const ccresponse = await addccresp.json();
    
    document.querySelector('#validate').textContent="Cloud Connector added Successfully !" ;
    alert('Cloud Connector added successfully!');
    btnHome();

  }
 


}

async function btnSAdetails(){


var maptable = document.getElementById("maptable");
var mapheader = document.getElementById("mapheader")

maptable.classList.remove('cctablevisible');
mapheader.classList.remove('cctablevisible');
  
  resptab.classList.remove('cctablevisible');
  var hostname = document.querySelector('#testlabel1').textContent ;
  console.log("Hostname "+hostname)
  var satab = document.getElementById("SAtable");
  var sahdr = document.getElementById("SAheader");

  sahdr.textContent = "Loading.....Please wait";
  sahdr.classList.remove('firstbtninvisble');
  sahdr.classList.add('cctablevisible','SAloading');

  const sadetails = await fetch('/getSAinfo',{
   method:'POST',
   body: JSON.stringify({hostname}) ,
  headers: { 'Content-Type': 'application/json' }
  }) ;
  
  const sadetailsresp = await sadetails.json();

  sadetailsrespjson = JSON.parse(sadetailsresp);
  
  document.getElementById('SAdata').innerHTML=" ";
  console.log(sadetailsrespjson.length);
  for (let i=0; i<sadetailsrespjson.length;i++){
    console.log("inside for loop");
      var timestamp = sadetailsrespjson[i].validtill ;
      var tilldate = new Date(timestamp);
      var expirydate = tilldate.getDate()+
           "/"+(tilldate.getMonth()+1)+
           "/"+tilldate.getFullYear()+
           " "+tilldate.getHours()+
           ":"+tilldate.getMinutes()+
           ":"+tilldate.getSeconds();
      document.querySelector('#SAdata').insertAdjacentHTML('beforeend','<td data-label="Technical name">'+sadetailsrespjson[i].subaccount+'</td>\n<td data-label="Display Name">'+sadetailsrespjson[i].displayname+'</td>\n<td data-label="Region Host">'+sadetailsrespjson[i].regionhost+'</td>\n<td data-label="Location ID">'+sadetailsrespjson[i].locationid+'</td>\n<td data-label="State">'+sadetailsrespjson[i].state+'</td>\n<td data-label="Cert valid till">'+expirydate+'</td>\n<td data-label="#"><a href="javascript:btnGetMapping('+i+')" class="SAbtn" id="SAbtn">Get ></a></td>');
      //document.querySelector('#SAdata').insertAdjacentHTML('beforeend','<td data-label="Display Name">'+sadetailsrespjson[i].displayname+'</td>');
      //document.querySelector('#SAdata').insertAdjacentHTML('beforeend','<td data-label="Region Host">'+sadetailsrespjson[i].regionhost+'</td>');
      //document.querySelector('#SAdata').insertAdjacentHTML('beforeend','<td data-label="Location ID">'+sadetailsrespjson[i].locationid+'</td>');
      //document.querySelector('#SAdata').insertAdjacentHTML('beforeend','<td data-label="State">'+sadetailsrespjson[i].state+'</td>');
      //document.querySelector('#SAdata').insertAdjacentHTML('beforeend','<td data-label="Cert valid till">'+sadetailsrespjson[i].validtill+'</td>');
  

      //var table = document.getElementById('SAtable');
      //console.log(table);


      //document.querySelector('#SAdata').
      //document.querySelector('#SAdata').insertAdjacentHTML('beforeend','<td data-label="System Mapping">'+sadetailsresp[i].state+'</td');

  }
  
  sahdr.textContent = "Subaccount Info";
  sahdr.classList.remove('SAloading');
  satab.classList.remove('firstbtninvisble');
 

  satab.classList.add('cctablevisible');
  

}

async function btnGetMapping(i){
  
  var satable = document.getElementById("SAtable");
   satable.classList.add('firstbtninvisble');
   var saheader = document.getElementById("SAheader");
   saheader.classList.add('firstbtninvisble');
   
   var maptab = document.getElementById("maptable");
   var maphdr = document.getElementById("mapheader");
  
   maphdr.textContent = "Loading.....Please wait";
   maphdr.classList.remove('firstbtninvisble');
   maphdr.classList.add('cctablevisible','maploading');
  
 
  //console.log("inside SAgetmapping"+document.querySelector('#testlabel1').textContent)
  sadetailsrespjson[i].hostname = document.querySelector('#testlabel1').textContent;
  //console.log(sadetailsrespjson[i]);
  
    
  const mappingdetails = await fetch('/getSystemMapping',{
    method:'POST',
    body: JSON.stringify(sadetailsrespjson[i]) ,
   headers: { 'Content-Type': 'application/json' }
   }) ;

   

   const mappingdetailsjson = await mappingdetails.json();
   
   var noofmappings = mappingdetailsjson.length;
   
   var satable = document.getElementById("SAtable");
   satable.classList.add('firstbtninvisble')

   document.getElementById('mapdata').innerHTML=" ";

   for (let i=0; i<noofmappings;i++){
    var virtualhost = mappingdetailsjson[i].virtualHost;
    var virtualport = mappingdetailsjson[i].virtualPort;
    var localhost = mappingdetailsjson[i].localHost;
    var localport = mappingdetailsjson[i].localPort;
    var protocol = mappingdetailsjson[i].protocol ;
    var backendtype = mappingdetailsjson[i].backendType ;
    var description = mappingdetailsjson[i].description ;
    
    
    document.querySelector('#mapdata').insertAdjacentHTML('beforeend','<td data-label="Virtual Host:Port">'+virtualhost+':'+virtualport+'</td>\n<td data-label="Local Host:Port">'+localhost+':'+localport+'</td>\n<td data-label="Protocol">'+protocol+'</td>\n<td data-label="Backend Type">'+backendtype+'</td>\n<td data-label="Description">'+description+'</td>');

   }
   document.querySelector('#mapheader').textContent = "System Mapping for "+sadetailsrespjson[i].subaccount+" ("+sadetailsrespjson[i].displayname+")";
   maphdr.classList.remove('maploading');
   maptab.classList.remove('firstbtninvisble');
   maptab.classList.add('cctablevisible');
   

   
}
