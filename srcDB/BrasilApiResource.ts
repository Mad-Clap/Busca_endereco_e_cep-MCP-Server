import { estadosBrasil, type endereco } from "../lib";

export async function buscarBrasilApiCep(args: string) {

    const url = `https://brasilapi.com.br/api/cep/v1/${args}`;

    return fetch(url)
        .then(
            async res => {

                var data: any = await res.json();

                if (!res.ok) {


                    if (data.message == "Todos os serviços de CEP retornaram erro.") {
                        return 'cep não encontrado na base de dados';
                    }

                    return 'Bad_Request: houve um erro na requisição enviada'
                }

                data = data as resBrasilApi;

                var estado: number = UF.indexOf(data.state)

                const endereco: endereco = {
                    cep: data.cep,
                    logradouro: data.street,
                    bairro: data.neighborhood,
                    localidade: data.city,
                    uf: data.state,
                    estado: estadosBrasil[estado]!,
                    regiao: getRegiao(data.state),
                }

                return endereco
            })

}

const UF = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
    'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']


type resBrasilApi = {
    cep: string,
    street: string, //logradouro
    neighborhood: string, //bairro
    city: string, //localidade
    state: string, // UF do estado
    service: string
}


type chavesUFRegiao = keyof typeof UFRegiao;

/**
 * @param uf 
 * @returns região do estado fornecido
 */ 
export function getRegiao(uf: string) {

  let key = uf as chavesUFRegiao

  return UFRegiao[key];
}


enum UFRegiao {
  // Região Norte
  AC = "Norte",
  AP = "Norte",
  AM = "Norte",
  PA = "Norte",
  RO = "Norte",
  RR = "Norte",
  TO = "Norte",
  
  // Região Nordeste
  AL = "Nordeste",
  BA = "Nordeste",
  CE = "Nordeste",
  MA = "Nordeste",
  PB = "Nordeste",
  PE = "Nordeste",
  PI = "Nordeste",
  RN = "Nordeste",
  SE = "Nordeste",
  
  // Região Centro-Oeste
  DF = "Centro-Oeste",
  GO = "Centro-Oeste",
  MT = "Centro-Oeste",
  MS = "Centro-Oeste",
  
  // Região Sudeste
  ES = "Sudeste",
  MG = "Sudeste",
  RJ = "Sudeste",
  SP = "Sudeste",
  
  // Região Sul
  PR = "Sul",
  RS = "Sul",
  SC = "Sul"
}