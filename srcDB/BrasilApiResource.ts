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
                    localidade: data.city,
                    uf: data.state,
                    estado: estadosBrasil[estado],
                    regiao: "",
                }

                return endereco
            })

}

const UF = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
    'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']


type resBrasilApi = {
    cep: string,
    state: string,
    city: string,
    neighborhood: string,
    street: string,
    service: string
}

export function isResBrasilApi(obj: any): obj is resBrasilApi {
    return 'cep' in obj && 'state' in obj && 'neighborhood' in obj
        && 'city' in obj && 'street' in obj && 'service' in obj
}