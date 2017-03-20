const FACEBOOK_ACCESS_TOKEN = 'EAAENZA37WCbwBAJ4CmLZA3QHuUQWulIjRiG1EBE3m38YI7ZCZAZB9QP6bpAZBevTjTMkRlUr34WPqdZC5mZAYo9Phn7h7sYl8cjCG1xFRGrN2YpKZAJnio6o70Tqe4hXRrPEB033k6QkuWh7bgAC99EzZBKhdpfRYHV1pxmBj2DoYTZCwZDZD';

const API_AI_TOKEN = '3a0ed0701dcc4bc7a242386623cca351';
const apiAiClient = require('apiai')(API_AI_TOKEN);

const request = require('request');

const MOVISTAR_WS = require('./ws_miMovistarNode');

var celular;
var clavePi;

var latUser = null;
var lonUser = null;

const sendTextMessage = (senderId, text) => {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: FACEBOOK_ACCESS_TOKEN },
        method: 'POST',
        json: {
            recipient: { id: senderId },
            message: { text },
        }
    });
};

function callSendAPI(messageData) {
    request({
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: FACEBOOK_ACCESS_TOKEN },
        method: 'POST',
        json: messageData      
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var recipientId = body.recipient_id;
            var messageId = body.message_id;
        } else {
            console.error("Unable to send message.");
            console.error(response);
            console.error(error);
        }
    });  
}

function sendCarrusel(senderId, elements) {
    var messageData = {
        recipient: {
            id: senderId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "generic",
                    elements: elements
                }
            }
        }
    };  
    callSendAPI(messageData);
}

module.exports = (event) => {    
    const senderId = event.sender.id;

    if (event.message.attachments) {
        latUser = event.message.attachments[0].payload.coordinates.lat;
        lonUser = event.message.attachments[0].payload.coordinates.long;        

        MAD_UBICACIONES_CERCANAS(function(aws){
            var resultado = [];
            
            for (var i = 0; i < aws.marcas.length; i++) {
                resultado[i] = aws.marcas[i];
            }
            
            var carrusel = [];

            for (var i = 0; i < resultado.length; i++) {
                newLat = resultado[i].latitud.split(".");
                newLon = resultado[i].longitud.split(".");

                if ((newLat[0] ===  "-") || (newLat[0] ===  "-"))
                    newLat[0] = newLat[0].replace("-","-0");

                carrusel[i] = {
                    title: resultado[i].description + " - " + resultado[i].name,
                    subtitle: resultado[i].address,
                    image_url: resultado[i].url,
                    buttons: [{
                        type: "web_url",
                        url: "http://maps.google.es/?q=" + newLat[0] + "." + newLat[1] + "%20" + newLon[0] + "." + newLon[1],
                        title: "Ubicación"
                    }]
                };
            }
            sendCarrusel(senderId,carrusel);
        });

        

    } else if (event.message.text) {
    	const message = event.message.text;

        const apiaiSession = apiAiClient.textRequest(message, {sessionId: 'finalbot'});

        apiaiSession.on('response', (response) => {
        	//console.log(response.result.contexts);

        	var resultBot = response.result.fulfillment.speech;	   
	   		sendTextMessage(senderId, resultBot);
	   
	    	if (response.result.action === 'clave') {
				const numero = response.result.contexts[1].parameters.number;

			   	
			   		celular=numero;
			   		//console.log ("El celular",numero);
			   	
			   		const clave = response.result.parameters.clave;
			   		clavePi=clave;
					//console.log ("CLAVE: ",clave);
					MAD_LOGIN(function (aws) {
						if(aws.isLogin === true){
							var resultBot1 = "Bienvenido ^_^";
							sendTextMessage(senderId, resultBot1);							 
						} else {
							var resultBot2 = aws ;
				        	sendTextMessage(senderId, resultBot2);						
						} 
						//console.log ("RESPUESTA BONITA:",aws);
					});
				
        	} else if (response.result.action === 'saldo') {
			    //console.log ("ESTE ES EL CELULAR",celular);
				MAD_CONSULTA_SALDO(function (aws) {
					var kathy="";
					if(aws.Controles[0].Data.saldo_plan===""){
						kathy ="\nNo tienes un plan Movistar activado";
					} else {
						kathy="\nPlan: "+aws.Controles[0].Data.saldo_plan;
					}				
					var resultBot5 = "Recargas:" + aws.Controles[0].Data.saldo_recarga + kathy; 
				    sendTextMessage(senderId, resultBot5);
					//console.log ("RESPUESTA BONITA:",aws);
					//console.log("Saldo Recargas: ",aws.Controles[0].Data.saldo_recarga);
					//console.log("Saldo Plan: ",aws.Controles[0].Data.saldo_plan);				
				});
        	}
			console.log("EL USUARIO DICE:",response.result.resolvedQuery);
			//console.log("MENSAJE DE USUARIO:",message);
			console.log("EL BOT DICE: ",resultBot);
        });
		apiaiSession.on('error', error => console.log(error));
        apiaiSession.end();
    }    
};

function MAD_UBICACIONES_CERCANAS(catcher) {
    var con = new MOVISTAR_WS();    
    con.setAccion("IMOVISTAR_TRAER_GEO_CERCANAS");

    var arg = {};
    arg.latitud = latUser;
    arg.longitud = lonUser;
    arg.filtro = "1";

    var session = {};
    session.imei="1234567890";
    session.version="2.2.28";
    session.id_session=1811903;

    con.setArgumentos(arg);
    con.setSession(session);

    con.servicio();

    con.setOnExito(catcher);
};

function MAD_LOGIN(catcher){
	

		var con = new MOVISTAR_WS();
		con.setAccion('IMOVISTAR_LOGIN');
		var arg = {};
		arg.documentoID=celular;		
		arg.clave=clavePi;
		arg.perfilUsuario="Numero";
		console.log('Argumentos',arg);
		var session = {};
		session.imei="1234567890";
		session.version="2.2.28";
		session.id_session="0";
		console.log ('Session: ',session);
		con.setArgumentos(arg);
		con.setSession(session);
		con.servicio();
		
		con.setOnExito (catcher);
		con.setOnError (catcher);
};


function MAD_CONSULTA_SALDO(catcher){
	var con = new MOVISTAR_WS();
		con.setAccion('IMOVISTAR_DATOS_LINEA');
		var arg = {};
		arg.linea=celular;		
		arg.keyid="all";
		console.log('Argumentos',arg);
		var session = {};
		session.imei="1234567890";
		session.version="2.2.28";
		session.id_session="0";
		console.log ('Session: ',session);
		con.setArgumentos(arg);
		con.setSession(session);
		con.servicio();
		
		con.setOnExito (catcher);
		con.setOnError (catcher);	
};