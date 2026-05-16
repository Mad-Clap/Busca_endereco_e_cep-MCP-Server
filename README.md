
# Busca endereco e CEP Server

## servidor MCP para busca de endereços por CEP e de CEPs por endereço

O servidor MCP "Busca endereco e CEP Server" fornece ferramentas de busca para encontrar informações de um endereço através de um CEP, ou para descobrir um CEP através das informações de um endereço. 

É utilizada a API pública [ViaCEP](https://viacep.com.br/) para realizar as consultas. Caso a conexão com o ViaCEP falhe em uma busca  de endereço através do CEP, é tentada uma conexão com a API pública [BrasilAPI](https://brasilapi.com.br/) ( não há redundância para busca de um CEP através de informações do endereço no momento)  

 O servidor também auxilia caso o usuário forneça um CEP que não possua bairro ou logradouro, abrindo a possibilidade de pesquisar se existe um CEP por logradouro, caso o usuário tenha informações sobre o endereço para realizar a busca. 


## Tools 🔧

### 1. Busca Endereço por CEP
Busca e confirma o endereço de um CEP fornecido:

  * Dados para busca: CEP (8 números)

* Elicitação - caso a busca do CEP retorne uma cidade, mas não um bairro ou logradouro, o servidor informa e pergunta se o usuário quer procurar um CEP por logradouro através do endereço (útil para descobrir possíveis novos CEPs por logradouro criados em localidades que possuíam CEPs únicos)

  * Dados para busca: logradouro, número, bairro, complemento

### 2. Busca CEP por endereço
Busca o CEP de um endereço fornecido

* Dados para busca: estado, município (localidade), logradouro, número, bairro, complemento

## Prompts ✒️
### Busca_CEP_por_endereço_prompt
Auxilia na utilização da ferramenta de busca de CEP por endereço, fornecendo o prompt para o usuário perguntar qual o CEP do endereço fornecido

 
## Instalação 💾

para instalar clone o repositório e adicione o servidor nas configurações do seu agente de IA.

Por exemplo, no Claude Desktop basta seguir o caminho "arquivo -> configurações -> desenvolvedor -> editar Config" e adicionar o servidor como no código abaixo, ajustando o caminho da pasta em que ele foi baixado. É necessário o [bun](https://bun.com/) para rodar o projeto.

````
{ "servers": {
	"Busca-Cep-Server": {
		"type": "stdio",
		"command": "bun",
		"args": [ "run",   "C:/User/MCP/Busca_endereco_e_cep-MCP-Server/index.ts"]
	}
 },
	"inputs": []
}
````

Também é possível utilizar o executável disponibilizado nos releases, o configurando da mesma forma.

## Tecnologias Utilizadas 🛠️
* TypeScript
* Bun
* Model Context Protocol (MCP)

## Ambiente de Desenvolvimento 🧰

* MCP TypeScript SDK
* Visual Studio Code