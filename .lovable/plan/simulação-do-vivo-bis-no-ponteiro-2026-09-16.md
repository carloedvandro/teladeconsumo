# Simulação do Vivo Bis no ponteiro

## Objetivo
Permitir visualizar, no próprio manômetro, a passagem da franquia mensal para o Vivo Bis acumulado quando a franquia chegar a 100%.

## Alterações
- Adicionar ao simulador uma opção **Usando Vivo Bis**.
- Nessa simulação, considerar a franquia mensal totalmente consumida e iniciar o consumo do saldo Vivo Bis disponível.
- Fazer o ponteiro representar o percentual consumido do Vivo Bis, mantendo o mesmo formato 3D e as animações atuais.
- Trocar o conteúdo central do manômetro para identificar claramente **Vivo Bis**, mostrando GB usados e o total disponível.
- Atualizar o status da linha para **Usando Vivo Bis**, com destaque roxo coerente com a página.
- Manter o comportamento atual nos demais estados e voltar ao manômetro normal ao selecionar **Automático (real)**.

## Regras preservadas
- O Vivo Bis usado vem do saldo acumulado do ciclo anterior.
- A franquia atual precisa estar em 100% antes de começar o consumo do Vivo Bis.
- O uso do Vivo Bis não cria novo saldo para o próximo ciclo.

## Validação
- Conferir a simulação em computador e celular.
- Confirmar que o ponteiro para no valor simulado, os textos cabem no cartão e os outros estados continuam funcionando.
