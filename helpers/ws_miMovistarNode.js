var unirest = require('unirest');

function ws_miMovistarNode() {
    this.argumentos.args = {};
};

ws_miMovistarNode.prototype.argumentos = {};
ws_miMovistarNode.prototype.resultado = {};
ws_miMovistarNode.prototype.session = {};

ws_miMovistarNode.prototype.servicio = function() {
    resultado = {};
    var request = {};
    request.funcion =  this.argumentos.funcion;
    request.args =  this.argumentos.args;
    request.session = this.argumentos.session;
    var strparams = "PARAM=" +  JSON.stringify(request);
    var realThis = this;
    unirest.post('https://app.movistar.com.ec/index.php')
    .headers({'Accept': 'application/json', 'Content-type': 'application/x-www-form-urlencoded'})
    .send(strparams)
    .end(function (response) {
        resultado = response.body;
        if (typeof resultado.error === 'undefined') {        
            realThis.ws_gui_idm_handle_json_exito(resultado.answer);
        } else {
            realThis.ws_gui_idm_handle_json_error(resultado.error);
        }
    });
};

ws_miMovistarNode.prototype.OnExito = function(response){
    throw "Tienes que Implementar OnExito";
};

ws_miMovistarNode.prototype.OnError = function(error){
    throw "Tienes que Implementar OnError";
};

ws_miMovistarNode.prototype.setOnExito = function(funExito){
    this.OnExito =funExito;
};

ws_miMovistarNode.prototype.setOnError = function(funError){
    this.OnError=funError;
};

ws_miMovistarNode.prototype.ws_gui_idm_handle_json_error = function(err){
    this.OnError(err);
};

ws_miMovistarNode.prototype.ws_gui_idm_handle_json_exito = function(aws){
    this.OnExito(aws);
};

ws_miMovistarNode.prototype.setArgumentos = function(argumentos){
    this.argumentos.args = argumentos;
};

ws_miMovistarNode.prototype.setAccion = function(accion){
    this.argumentos.funcion = accion;
};

ws_miMovistarNode.prototype.setSession = function(session){
    this.argumentos.session = session;
};

module.exports= ws_miMovistarNode;