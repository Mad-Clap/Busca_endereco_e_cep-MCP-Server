import { buscarBaseCep } from "./srcDB/BuscaCep";


/**
 *  Acesso as bases de dados disponíveis para busca por endereço e CEP
 */
export async function buscarBase(args: string) {
  return buscarBaseCep(args);
}


/**
 * Tipos do domínio da aplicação
 */

export type endereco = {
  cep: string,
  logradouro?: string | null,
  complemento?: string | null,
  unidade?: string | null,
  bairro?: string | null,
  localidade: string,
  uf: string,
  estado: string,
  regiao: string,
  ibge?: string,
  gia?: string | null,
  ddd?: string | null,
  siafi?: string | null
};

export type buscaCepReq = {
  uf: string,
  localidade: string,
  logradouro: string,
  numero: number,
  bairro: string,
  complemento?: string | null
}

/**
 * 
 * @param obj 
 * @returns true se o objeto for do tipo endereco
 */
export function isEndereco(obj: endereco | string): obj is endereco {
  return (obj as endereco).cep !== undefined;
}

/**
 * Lista dos estados do Brasil (utilizado para o autopreenchimento do campo UF no prompt)
 */
export const estadosBrasil = [
  "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", "Distrito Federal", "Espírito Santo", "Goiás", "Maranhão",
  "Mato Grosso", "Mato Grosso do Sul", "Minas Gerais", "Pará", "Paraíba", "Paraná", "Pernambuco", "Piauí", "Rio de Janeiro",
  "Rio Grande do Norte", "Rio Grande do Sul", "Rondônia", "Roraima", "Santa Catarina", "São Paulo", "Sergipe", "Tocantins"
];

/**
 * Mapeamento dos estados do Brasil para suas UFs
 * @enum UF
 */
enum UF {
  RONDONIA = 'RO', ACREMATO = 'AC', AMAZONAS = 'AM', RORAIMA = 'RR', PARA = 'PA', AMAPA = 'AP', TOCANTINS = 'TO',
  MARANHAO = 'MA', PIAUI = 'PI', CEARA = 'CE', RIOGRANDEDONORTE = 'RN', PARAIBA = 'PB', PERNAMBUCO = 'PE', ALAGOAS = 'AL',
  SERGIPE = 'SE', BAHIA = 'BA', MINASGERAIS = 'MG', ESPIRITOSANTO = 'ES', RIODEJANEIRO = 'RJ', SAOPAULO = 'SP',
  PARANA = 'PR', SANTACATARINA = 'SC', RIOGRANDEDOSUL = 'RS', MATOGROSSODOSUL = 'MS', MATOGROSSO = 'MT', GOIAS = 'GO',
  DISTRITOFEDERAL = 'DF'

}

type chavesUF = keyof typeof UF;

/**
 * @param estado 
 * @returns UF do estado fornecido
 */ 
export function getUf(estado: string) {

  let key = formatar(estado) as chavesUF

  return UF[key];
}

/**
 * 
 * @param str 
 * @returns string formatada (sem acentos, sem caracteres especiais e em maiúsculo) 
 */
export function formatar(str: string) {
  return str.normalize('NFD').replace(/([\u0300-\u036f]|[^0-9a-zA-Z])/g, '').toUpperCase()
}



/**
 * 
 * @param params 
 * @returns CEP e informações do endereço encontrado através dos parâmetros passados pelo usuário
 */
export async function buscarCepPorEndereco(params: buscaCepReq) {

  // converte o nome do estado para a UF correspondente
  if (params.uf.length > 2) { params.uf = getUf(params.uf) }

  // monta a string de busca pelo endereço e busca na base de dados
  let endereco: string = `${params.uf}/${params.localidade}/${params.logradouro}`;
  let res: endereco[] | string = await buscarBase(endereco);

  // retorna caso tenha ocorrido um erro
  if (typeof res === 'string') { return res }

  //retorna caso haja apenas um endereço no array (será o correto)
  if (res.length == 1) { return res[0] }
  
  // busca pelo endereço correto através das informações de bairro, número e complemento passadas pelo usuário //

  //filtra por rua e por bairro. Primeiro por strings iguais, 
  // depois por strings que contenham a outra caso o filtro anterior não retorne resultados
  let filtroRuaBairro: endereco[] = res.filter(v => formatar(v.logradouro!) == formatar(params.logradouro)
    || formatar(params.logradouro) == formatar(v.logradouro!))
    .filter(v => formatar(v.bairro!).includes(formatar(params.bairro)) || formatar(params.bairro).includes(formatar(v.bairro!)))

  if(filtroRuaBairro.length == 0){
    filtroRuaBairro = res.filter(v => formatar(v.logradouro!).includes(formatar(params.logradouro))
    || formatar(params.logradouro).includes(formatar(v.logradouro!)))
    .filter(v => formatar(v.bairro!).includes(formatar(params.bairro)) || formatar(params.bairro).includes(formatar(v.bairro!)))
  }
  //retorna erro caso não seja encontrado um endereço com o bairro informado
  if(filtroRuaBairro.length == 0) return 'O bairro informado não foi encontrado na cidade e estado fornecido'

  //retorna caso haja apenas um endereço no array filtroRuaBairro (será o correto)
  if (filtroRuaBairro.length == 1) { return filtroRuaBairro[0] }

  // Filtra o array filtroRuaBairro pelo retorno dos campos "complemento" e "unidade"
  if (params.complemento) {

    //filtra por unidade
    let filtroComp: endereco[] = filtroRuaBairro.filter(v => v.unidade? formatar(v.unidade!).includes(formatar(params.complemento!))
      || formatar(params.complemento!).includes(formatar(v.unidade!)): false)

    //retorna caso haja apenas um endereço no array (será o correto)
    if (filtroComp.length == 1) { return filtroComp[0] }

    //filtra por complemento passado pelo usuário
    filtroComp = filtroComp.length > 0 ?
      filtroComp.filter(v => v.complemento? formatar(v.complemento).includes(formatar(params.complemento!))
        || formatar(params.complemento!).includes(formatar(v.complemento)): false)
      :
      filtroRuaBairro.filter(v => v.complemento? formatar(v.complemento).includes(formatar(params.complemento!))
        || formatar(params.complemento!).includes(formatar(v.complemento)): false)

    //Se houver algo em filtroComp deve ser o endereço correto, e haverá apenas um endereço no array
    if (filtroComp.length == 1) { return filtroComp[0] }
  }

  //filtra por complemento dos endereços no array filtroRuaBairro e o número do endereço passado pelo usuário

  let ladoRua : endereco = null as unknown as endereco;

  for (let i = 0; i < filtroRuaBairro.length; i++) {

    let endereco = filtroRuaBairro[i];
    if (endereco && endereco.complemento) {

      //Busca pelo lado da rua, caso haja essa informação no complemento
      if (endereco.complemento === "lado par" && params.numero % 2 == 0) { ladoRua = endereco }

      if (endereco.complemento === "lado ímpar" && params.numero % 2 != 0) { ladoRua = endereco}


      //Busca por faixa de números no complemento
      let complemento = endereco.complemento.split(" ");

      complemento = complemento.filter( v => v.match(/^\d+$/))
      
      if(complemento.length == 0)
         continue
      else if(complemento.length == 1 && params.numero == parseInt(complemento[0], 10))
          return endereco;
      else if (complemento.length == 2){

        let menorNum = parseInt(complemento[0],10);
        let maiorNum = parseInt(complemento[1],10);
        if(menorNum > maiorNum) { let aux = maiorNum; maiorNum = menorNum; menorNum = aux} 

        if(params.numero >= menorNum || params.numero <= maiorNum){ return endereco}

      }
      else
         continue

    }
  }
  
  if (ladoRua) {return ladoRua}

  return "Não foi possível definir o CEP desse endereço";
}