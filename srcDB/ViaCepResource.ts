export async function buscarViaCep(args: string){

    const url = `https://viacep.com.br/ws/${args}/json/`;

   return fetch(url)
    .then( 
    async res =>{ 

        if(!res.ok){return 'Bad_Request: houve um erro na requisição enviada'}

        var data: any = await res.json(); 

        if(data.erro) {return 'cep não encontrado na base de dados';}

        if(Array.isArray(data)){
            
            if(data.length==0) {return 'endereço não encontrado na base de dados'}
        }

        return data
    })
}