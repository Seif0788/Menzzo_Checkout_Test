# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Preferências de Consentimento" [ref=e3] [cursor=pointer]:
    - img "Revisit consent button" [ref=e4]
  - generic [ref=e5]:
    - banner [ref=e6]:
      - generic [ref=e7]:
        - text: 
        - link "store logo" [ref=e8] [cursor=pointer]:
          - /url: https://www.menzzo.pt/
          - img "Menzzo.pt" [ref=e9]
    - main [ref=e10]:
      - heading "Finalizar o pedido" [level=1] [ref=e12]
      - generic [ref=e14]:
        - generic [ref=e17] [cursor=pointer]:
          - text: Já tem uma conta?
          - strong [ref=e18]: Clique aqui
          - text: para fazer login
          - strong [ref=e19]: ou criar uma conta Menzzo
        - generic [ref=e21]:
          - generic [ref=e22]: Inicie sessão rapidamente usando a sua conta Facebook ou Google.
          - generic [ref=e23]:
            - link "Conectar com Google" [ref=e25] [cursor=pointer]:
              - /url: https://www.menzzo.pt/amsociallogin/social/login/?type=google
              - generic [ref=e27]: Conectar com Google
            - link "Conectar com Facebook" [ref=e29] [cursor=pointer]:
              - /url: https://www.menzzo.pt/amsociallogin/social/login/?type=facebook
              - generic [ref=e31]: Conectar com Facebook
    - button "Chat Menzzo" [ref=e32] [cursor=pointer]:
      - img "Chat Menzzo"
```