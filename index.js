//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var http = require('http');
var path = require('path');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');

//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'client')));
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: false}));

var messages = [];
var sockets = [];

var _estados = [];

router.get('/webhook', function(req, res){
  
  if(req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === 'senha123'){
    console.log('Validação ok!');
    res.status(200).send(req.query['hub.challenge']);
    
  }
  else{
    console.log('Validação Falhou!');
    res.sendStatus(403);
  }
  
});

router.post('/webhook', function(req, res){
  var data = req.body;
  
  if(data && data.object === 'page'){
    //percorrer todas as entradas ENTRY
    data.entry.forEach(function (entry){
      var pageID = entry.id;
      var timeOfEvent = entry.time;
      
      //Percorrer todas as mensagens
      entry.messaging.forEach(function (event){
        if (event.message){
          trataMensagem(event);
        } else{
          if(event.postback && event.postback.payload){
            switch (event.postback.payload) {
              case 'clicou_comecar':
                sendTextMessage(event.sender.id,'Em que posso te servir?');
                //sendFirstMenu(event.sender.id);
                menuPrincipal(event.sender.id);
                break;
              case 'clicou_cardapios':
                sendTextMessage(event.sender.id, 'Nosso cardapio:');
                menuCardapios(event.sender.id);
                break;
              
              default:
                // code
            }
          }
        }
      })
    })
    
    res.sendStatus(200);
  }
});

//modelo de botão generico (carrossel)
function menuPrincipal(recipientID) {
  var messageData = {
    recipient:{
    id: recipientID
  },
  message:{
    attachment:{
      type:"template",
      payload:{
        template_type:"generic",
        elements:[
           {
            title:"Cardapios",
            image_url:"https://www.annabelkarmel.com/wp-content/uploads/2007/08/Healthier-Hamburgers-3-380x315.jpg",
            subtitle:"Visualize nossos cardapios e confira nossos produtos!",
            buttons:[
              {
                type:"postback",
                title:"Cardapios",
                payload:"clicou_cardapios"
              }              
            ]   
          },
          {
            title:"Horarios e Localização",
            image_url:"https://www.portaldofranchising.com.br/wp-content/uploads/2014/09/localizacao-das-franquias-no-brasil1.jpg",
            subtitle:"Confira nossa localização",
            buttons:[
              {
                type:"postback",
                title:"Localização",
                payload:"DEVELOPER_DEFINED_PAYLOAD"
              }              
            ]   
          }
        ]
      }
    }
  }
  };
  
  callSendAPI(messageData);
}

function menuCardapios(recipientID) {
  var messageData = {
    recipient:{
    id: recipientID
  },
  message:{
    attachment:{
      type:"template",
      payload:{
        template_type:"generic",
        elements:[
           {
            title:"Entradas",
            image_url:"https://www.pasmania.com.br/pedidos/image/cache/data/Pratos/Polenta-Frita-Temperada-383x287.jpg",
            subtitle:"Veja nossos aperitivos!",
            buttons:[
              {
                type:"postback",
                title:"Entradas",
                payload:"clicou_entradas"
              }              
            ]   
          },
          {
            title:"Hamburgers",
            image_url:"http://cdn.playbuzz.com/cdn/91d87a93-aaa9-473b-9d4d-9a3ed52ae013/d759e6d6-e4ae-497c-8d1b-4e8b598e4e6e.jpg",
            subtitle:"Veja nossos hamburgers",
            buttons:[
              {
                type:"postback",
                title:"Hamburgers",
                payload:"clicou_hamburgers"
              }              
            ]   
          },
          {
            title:"Pizzas",
            image_url:"https://i.ytimg.com/vi/qSRTbJKDMk4/maxresdefault.jpg",
            subtitle:"Veja nossas Pizzas",
            buttons:[
              {
                type:"postback",
                title:"Pizzas",
                payload:"clicou_pizzas"
              }              
            ]   
          },
          {
            title:"Bebidas",
            image_url:"http://pizzariaminastche.com.br/wp-content/uploads/2016/11/bebidas.png",
            subtitle:"Veja nossas Bebidas",
            buttons:[
              {
                type:"postback",
                title:"Bebidas",
                payload:"clicou_bebidas"
              }              
            ]   
          },{
            title:"Voltar ao menu principal",
            image_url:"http://www.pixempire.com/images/preview/arrow-back-icon.jpg",
            subtitle:"Voltar ao menu principal",
            buttons:[
              {
                type:"postback",
                title:"Menu Principal",
                payload:"clicou_menu"
              }              
            ]   
          }
        ]
      }
    }
  }
  };
  
  callSendAPI(messageData);
}



//chama o menu novamente
function showOptionsMenu(recipientID) {
  
  setTimeout(function () {
    sendTextMessage(recipientID,"Posso te ajudar em algo mais?");
  _estados[recipientID] = 'options_menu';
  }, 2500);
}


//envia a mensagem para a função callSendAPI (responsável por enviar a mensagem)
function sendTextMessage(recipientID, messageText) {
  var messageData = {
    recipient: {
      id: recipientID
    },
    message:{
      text: messageText
    }
  };
  
  callSendAPI(messageData);
}

//envia a mensagem para o facebook
function callSendAPI (messageData){
  
  request({
    uri:'https://graph.facebook.com/v2.6/me/messages',
    qs:{ access_token:'EAABw4xIvQA4BAL0q49WfYOcEBFu6roplSG1nBZAZBzPWXtXMvZAqqsRV6EdYPJS5FAhaZCSGvWZCJ8ytg53m1RrSHZBJaZAxuele2mQwNbE6BZAq3M6F1b9AUfGDFc8jEfgU9ABle0kaOKGUl4YoXKfIsozQ8gyhozdg0IIi1Ba7ZBAZDZD'},
    method: 'POST',
    json: messageData
  }, function (error, response, body){
    
    if(!error && response.statusCode == 200){
      console.log('Mensagem enviada com sucesso');
      var recipientID = body.recipient_id;
      var messageID = body.message_id;
    } 
    else{
      console.log('Nao foi possivel enviar mensagem');
      console.log(error);
      console.log(messageData);
    }
    
  })
  
}





//tal função trata a mensagem antes de enviar
function trataMensagem (event){
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;
  
  console.log("Mensagem do usuario %d pela pagina %d", senderID, recipientID);
  
  var messageID = message.mid;
  var messageText = message.text;
  var attachments = message.attachments;
  
  if (messageText){
    
    if(_estados[senderID]){
      switch (_estados[senderID]) {
        case 'options_menu':
          switch (messageText) {
            case 'sim':
              menuCarrossel(senderID);
              break;
            case 'nao':
              sendTextMessage(senderID, 'tchau');
              break;
            default:
              // code
          }
          break;
        
        default:
          // code
      }
    }
    else{
      
      switch (messageText) {
      case 'oi':
        sendTextMessage(senderID,'Oi tudo bem com você?');
        break;  
      case 'tchau': 
        sendTextMessage(senderID,'Tchau, volte sempre');
        break;
      
      default:
      sendTextMessage(senderID,'Não entendi');
        
      }
  }
    
    
  }
  else if(attachments){
    console.log('anexo');
  }
}

/* funções que nao estão sendo utilizados

//modelo de botão simples
function sendFirstMenu(recipientID) {
  var messageData = {
    recipient: {
      id: recipientID
    },
    message:{
    attachment:{
      type:"template",
      payload:{
        template_type:"button",
        text:"O que você procura?",
        buttons:[
          {
            type:"web_url",
            url:"https://www.messenger.com",
            title:"Site do estabelecimento"
          },
          {
            type:"postback",
            title:"Cardapio Pizzas",
            payload: "clicou_pizza"
          }
          ]
        }
      }
    }
  };
  
  callSendAPI(messageData);
}

*/
















//metodos de configuração abaixo -------

io.on('connection', function (socket) {
    messages.forEach(function (data) {
      socket.emit('message', data);
    });

    sockets.push(socket);

    socket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(socket), 1);
      updateRoster();
    });

    socket.on('message', function (msg) {
      var text = String(msg || '');

      if (!text)
        return;

      socket.get('name', function (err, name) {
        var data = {
          name: name,
          text: text
        };

        broadcast('message', data);
        messages.push(data);
      });
    });

    socket.on('identify', function (name) {
      socket.set('name', String(name || 'Anonymous'), function (err) {
        updateRoster();
      });
    });
  });

function updateRoster() {
  async.map(
    sockets,
    function (socket, callback) {
      socket.get('name', callback);
    },
    function (err, names) {
      broadcast('roster', names);
    }
  );
}

function broadcast(event, data) {
  sockets.forEach(function (socket) {
    socket.emit(event, data);
  });
}

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});
