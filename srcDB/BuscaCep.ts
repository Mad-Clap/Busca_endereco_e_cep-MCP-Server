import { buscarViaCep } from "./ViaCepResource";

export async function buscarBaseCep(args: string){

    try {

      return buscarViaCep(args)

    } catch (error) {

        if(args.match(/^\d{8}$/)){
            
            let {buscarBrasilApiCep} = await import("./BrasilApiResource")

            try{
                return buscarBrasilApiCep(args)
            }
            catch(error){
                return "Internal_Server_Error - serviço não disponível"
            }
        }
        
        return "Internal_Server_Error - serviço não disponível"
    }
}