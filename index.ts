import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { completable } from '@modelcontextprotocol/sdk/server/completable.js';
import { z } from "zod";
import { type endereco, isEndereco, type buscaCepReq, estadosBrasil, formatar, buscarCepPorEndereco } from "./lib";
import { buscarBaseCep } from "./srcDB/BuscaCep";


// Criando o servidor MCP
const app = new McpServer({
  name: "Busca endereco e CEP Server",
  version: "1.0.0",
});


app.registerTool(
  "Busca_endereco_por_cep",
  {
    title: "Busca endereço pelo CEP",
    description: "Busca e confirma o endereço de um CEP fornecido",
    inputSchema: {
      cep: z.string().regex(/^\d{8}$/, "cep must be a string composed of 8 numbers")
        .describe("Postal code to be queried - must be a string composed of 8 numbers"),
    },
  },

  async ({ cep }) => {

    let res: string | endereco = await buscarBaseCep(cep);

    if (isEndereco(res)) {

      let cepAux = res.cep;

      let messagem = "Endereço encontrado:"

      if (!res.logradouro && !res.bairro) {
        const elicitation = await elicitacao(res.localidade);

        if (elicitation.action == 'accept' && elicitation.content?.logradouro) {

          let enderecoRequest = { uf: res.uf, localidade: res.localidade, ...elicitation.content} as buscaCepReq

          res = await buscarCepPorEndereco(enderecoRequest);

          if (typeof res === 'string') {
            return {
              content: [{ type: "text", text: `Error: ${res}` }],
              isError: true
            };
          }

          if(cepAux === res.cep)
            {messagem = "Infelizmente não foi encontrado um CEP por rua/logradouro para o endereço fornecido. Essas foram as informações encontradas:"}
          else messagem = "O endereço fornecido possui um CEP por rua/logradouro:"

        }

      }
      return {
        content: [{
          type: "text", text: `
${messagem}
CEP: ${res.cep}
Logradouro: ${res.logradouro || "N/A"}
Complemento: ${res.complemento || "N/A"}
Unidade: ${res.unidade || "N/A"}
Bairro: ${res.bairro || "N/A"}
Cidade: ${res.localidade}
Estado: ${res.estado} (${res.uf})
Região: ${res.regiao}
DDD: ${res.ddd || "N/A"}
Código Município IBGE: ${res.ibge || "N/A"}
        `
        }]
      }
    }
    else return {
        content: [{ type: "text", text: `Error: ${res}` }],
        isError: true
      };
  },

);


app.registerTool(
  "Busca_cep_por_endereco",
  {
    title: "Busca o CEP pelo endereço",
    description: "Busca o CEP de um endereço fornecido",
    inputSchema: {
      buscaCepReq: z.object({
        uf: z.string().describe("Adress State"),
        localidade: z.string().describe("Adress city"),
        logradouro: z.string().describe("adress street"),
        numero: z.number().describe("Adress number"),
        bairro: z.string().describe("Adress district"),
        complemento: z.string().describe("address complement")
      }).describe("Adress to search the postal code"),
    },
  },
  async ({ buscaCepReq }) => {

    let res: string | endereco = await buscarCepPorEndereco(buscaCepReq);

    if (isEndereco(res)) {

      return {
        content: [{
          type: "text", text: `
CEP encontrado:
CEP: ${res.cep}

Informações do endereço:
Logradouro: ${res.logradouro || "N/A"}
Complemento: ${res.complemento || "N/A"}
Unidade: ${res.unidade || "N/A"}
Bairro: ${res.bairro || "N/A"}
Cidade: ${res.localidade}
Estado: ${res.estado} (${res.uf})
Região: ${res.regiao}
DDD: ${res.ddd || "N/A"}
Código Município IBGE: ${res.ibge || "N/A"}
      `
        }]
      }
    }
      else return {
        content: [{ type: "text", text: `Error: ${res}` }],
        isError: true
      };
    
  },
);


app.registerPrompt(
  "Busca_cep_prompt",
  {
    title: "Busca cep prompt",
    description: "Busca o CEP de um endereço fornecido",
    argsSchema: {
      uf: completable(z.string().describe("Estado"), value => {
        return estadosBrasil.filter(d => d.startsWith(value));
      }),
      localidade: z.string().describe("Cidade"),
      logradouro: z.string().describe("Rua - coloque o nome e se for rua, avenida, travessa, etc"),
      numero: z.string().regex(/^\d+$/, "apenas o número do local").describe("número do endereço"),
      bairro: z.string().describe("bairro"),
      complemento: z.string().describe("digite caso houver complemento/unidade, ou 'não' se não houver")
    },
  },
  ({ uf, localidade, logradouro, numero, bairro, complemento }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: formatar(complemento) === "NAO" ?
            `Qual o CEP do logradouro ${logradouro} número ${numero},
           no bairro ${bairro}, na cidade ${localidade} e estado ${uf} ?`
            :
            `Qual o CEP da rua/logradouro ${logradouro} número ${numero},
           no bairro ${bairro}, na cidade ${localidade} e estado ${uf}, complemento: ${complemento} ?`
        },
      },
    ],
  }),
);




async function main() {
  // Start receiving messages on stdin and sending messages on stdout
  const transport = new StdioServerTransport();
  await app.connect(transport);
}

if (import.meta.main) {
  main();
}


async function elicitacao(localidade: string) {

  return app.server.elicitInput({
    message: `O CEP fornecido abrange a cidade ${localidade} inteira. Com as mudanças recentes na distribuição de CEPs, é possível que seu endereço possua um CEP próprio para sua rua/logradouro. Gostaria de procurar seu CEP com base no seu endereço?`,
    requestedSchema: {
      type: 'object',
      properties: {
        logradouro: {
          type: 'string',
          title: 'adress street',
          description: 'Rua'
        },
        numero: {
          type: 'number',
          title: 'Adress number',
          description: 'número do endereço'
        },
        bairro: {
          type: 'string',
          title: 'Adress district',
          description: 'bairro'
        },
        complemento: {
          type: 'string',
          title: 'address complement',
          description: 'complemento'
        }
      },
      required: ['uf', 'localidade', 'logradouro', 'numero', 'bairro']
    }
  });
}

