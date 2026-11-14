// FoundrySpecification.chatProviderRoutingBoundary: no implicit engine substitution.
import {LargeLanguageModelSchema} from './chat-contracts.mjs';
// The device's one model. Its former identifiers name the same route, so a selection stored before a rename still resolves.
const LOCAL_MODEL='webgpu:Qwen',FORMER_LOCAL_MODELS=['webgpu:BitNet','webgpu:Bonsai'];
const fail=code=>Object.assign(new Error(code==='unsupportedChatProvider'?'The chat provider is unsupported':'The chat model selection is invalid'),{code});
export function chatModelRoute(chatSelection,defaultSelection){
 const chosen=chatSelection??defaultSelection;
 try{
  LargeLanguageModelSchema.parse(chosen);
  for(const value of [chosen?.provider,chosen?.name])if(typeof value!=='string'||!value.length||value.length>256||value.trim()!==value||/[\x00-\x1f\x7f]/.test(value))throw Error();
 }catch{throw fail('invalidChatModelSelection');}
 const {provider,name}=chosen;
 if(!['local','openrouter','featherless'].includes(provider))throw fail('unsupportedChatProvider');
 if(provider==='local'&&name!==LOCAL_MODEL&&!FORMER_LOCAL_MODELS.includes(name))throw fail('invalidChatModelSelection');
 return Object.freeze({provider,model:provider==='local'?LOCAL_MODEL:provider+'/'+name,paid:provider!=='local'});
}
