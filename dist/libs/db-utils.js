"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Blacklist = exports.OAuthScopes = exports.UserRoles = void 0;
class UserRoles {
    constructor(bitmask) { this.bitmask = bitmask; }
    /**
     * Verifies if the user has the specified role
     * @param role The role to check
     * @returns True if the user has the role
     */
    has(role) {
        return (this.bitmask & UserRoles.FLAGS[role]) !== 0;
    }
    /**
     * Sets a role for the user
     * @param role The role to set
     */
    set(role) {
        this.bitmask |= UserRoles.FLAGS[role];
    }
    /**
     * Removes a role for the user
     * @param role The role to remove
     */
    unset(role) {
        this.bitmask &= ~UserRoles.FLAGS[role];
    }
    /**
     * Returns a string list of the roles the user has
     * @returns The roles the user has
     */
    *values() {
        for (const role in UserRoles.FLAGS) {
            if (role === 'ALL')
                continue;
            if (this.has(role))
                yield role;
        }
    }
    /**
     * Returns a string list of html badges for the roles the user has
     */
    *badges() {
        for (const role of this.values()) {
            const roleName = UserRoles.FLAGS_NAMES[role];
            var badgeClass = 'badge';
            switch (role) {
                case 'OWNER':
                    badgeClass += ' alex-skunk';
                    break;
                case 'DEVELOPER':
                    badgeClass += ' pinky';
                    break;
                case 'ADMIN':
                    badgeClass += ' success';
                    break;
                case 'STAFF':
                    badgeClass += ' warning';
                    break;
                case 'VETERAN':
                    badgeClass += ' orange';
                    break;
                case 'VERIFIED_USER':
                    badgeClass += ' generic';
                    break;
                case 'VERIFIED_DEVELOPER':
                    badgeClass += ' alert';
                    break;
                case 'BUG_HUNTER':
                    badgeClass += ' blurple';
                    break;
            }
            yield `<span class="${badgeClass}"><div class="dot"></div>${roleName}</span>`;
        }
    }
}
exports.UserRoles = UserRoles;
(function (UserRoles) {
    let FLAGS;
    (function (FLAGS) {
        FLAGS[FLAGS["OWNER"] = 1] = "OWNER";
        FLAGS[FLAGS["DEVELOPER"] = 2] = "DEVELOPER";
        FLAGS[FLAGS["ADMIN"] = 4] = "ADMIN";
        FLAGS[FLAGS["STAFF"] = 8] = "STAFF";
        FLAGS[FLAGS["VETERAN"] = 16] = "VETERAN";
        FLAGS[FLAGS["VERIFIED_USER"] = 32] = "VERIFIED_USER";
        FLAGS[FLAGS["VERIFIED_DEVELOPER"] = 64] = "VERIFIED_DEVELOPER";
        FLAGS[FLAGS["BUG_HUNTER"] = 128] = "BUG_HUNTER";
        FLAGS[FLAGS["ALL"] = 255] = "ALL";
    })(FLAGS = UserRoles.FLAGS || (UserRoles.FLAGS = {}));
    UserRoles.FLAGS_NAMES = {
        OWNER: 'Owner',
        DEVELOPER: 'Developer',
        ADMIN: 'Admin',
        STAFF: 'Staff',
        VETERAN: 'Veteran',
        VERIFIED_USER: 'Verified User',
        VERIFIED_DEVELOPER: 'Verified Developer',
        BUG_HUNTER: 'Bug Hunter',
        ALL: 'All'
    };
})(UserRoles || (exports.UserRoles = UserRoles = {}));
class OAuthScopes {
    constructor(bitmask) { this.bitmask = bitmask; }
    /**
     * Verifies if the scopes list has the specified scope
     * @param role The role to check
     * @returns True if the list has the scope
     */
    has(role) {
        return (this.bitmask & OAuthScopes.FLAGS[role]) !== 0;
    }
    /**
     * Sets a scope to the scopes list
     * @param role The scope to set
     */
    set(role) {
        this.bitmask |= OAuthScopes.FLAGS[role];
    }
    /**
     * Removes a scope from the scopes list
     * @param role The scope to remove
     */
    unset(role) {
        this.bitmask &= ~OAuthScopes.FLAGS[role];
    }
    /**
     * Returns a string list of the scopes list
     * @returns The scopes list
     */
    *values() {
        for (const role in OAuthScopes.FLAGS) {
            if (this.has(role))
                yield OAuthScopes.toFlagString(role);
        }
    }
    /**
     * Returns a human readable string list of the scopes list explaining what each scope does
     * @returns The scopes list
     */
    *descriptions() {
        for (const role in OAuthScopes.FLAGS) {
            if (this.has(role))
                yield OAuthScopes.FLAGS_DESCRIPTIONS.en[role];
        }
    }
    static toFlagKey(flag) {
        return flag.toUpperCase().replace(/\./g, '_');
    }
    static toFlagString(flag) {
        return flag.toLowerCase().replace(/\_/g, '.');
    }
    static toFlag(flag) {
        return OAuthScopes.FLAGS[OAuthScopes.toFlagKey(flag)];
    }
}
exports.OAuthScopes = OAuthScopes;
(function (OAuthScopes) {
    let FLAGS;
    (function (FLAGS) {
        FLAGS[FLAGS["IDENTIFY"] = 1] = "IDENTIFY";
        FLAGS[FLAGS["EMAIL"] = 2] = "EMAIL";
        FLAGS[FLAGS["FOLLOWERS"] = 4] = "FOLLOWERS";
        FLAGS[FLAGS["FOLLOWERS_WRITE"] = 8] = "FOLLOWERS_WRITE";
        FLAGS[FLAGS["SHOUTS"] = 16] = "SHOUTS";
        FLAGS[FLAGS["SHOUTS_WRITE"] = 32] = "SHOUTS_WRITE";
        FLAGS[FLAGS["BLOCKLIST"] = 64] = "BLOCKLIST";
        FLAGS[FLAGS["BLOCKLIST_WRITE"] = 128] = "BLOCKLIST_WRITE";
    })(FLAGS = OAuthScopes.FLAGS || (OAuthScopes.FLAGS = {}));
    OAuthScopes.FLAGS_DESCRIPTIONS = {
        en: {
            IDENTIFY: 'Read your user data.',
            EMAIL: 'Read your email address.',
            FOLLOWERS: 'Read your followers.',
            FOLLOWERS_WRITE: 'Write your followers.',
            SHOUTS: 'Read your public comments.',
            SHOUTS_WRITE: 'Write public comments.',
            BLOCKLIST: 'Read your blocklist.',
            BLOCKLIST_WRITE: 'Add and remove users from your blocklist.'
        },
        es: {
            IDENTIFY: 'Leer tus datos de usuario.',
            EMAIL: 'Leer tu dirección de correo electrónico.',
            FOLLOWERS: 'Leer tus seguidores.',
            FOLLOWERS_WRITE: 'Escribir tus seguidores.',
            SHOUTS: 'Leer tus comentarios públicos.',
            SHOUTS_WRITE: 'Escribir comentarios públicos.',
            BLOCKLIST: 'Leer tu lista de bloqueados.',
            BLOCKLIST_WRITE: 'Añadir y eliminar usuarios de tu lista de bloqueados.'
        },
        pt: {
            IDENTIFY: 'Leia seus dados de usuário.',
            EMAIL: 'Leia seu endereço de e-mail.',
            FOLLOWERS: 'Leia seus seguidores.',
            FOLLOWERS_WRITE: 'Escreva seus seguidores.',
            SHOUTS: 'Leia seus comentários públicos.',
            SHOUTS_WRITE: 'Escreva comentários públicos.',
            BLOCKLIST: 'Leia sua lista de bloqueados.',
            BLOCKLIST_WRITE: 'Adicionar e remover usuários de sua lista de bloqueados.'
        },
        fr: {
            IDENTIFY: 'Lire vos données utilisateur.',
            EMAIL: 'Lire votre adresse e-mail.',
            FOLLOWERS: 'Lire vos abonnés.',
            FOLLOWERS_WRITE: 'Écrire vos abonnés.',
            SHOUTS: 'Lire vos commentaires publics.',
            SHOUTS_WRITE: 'Écrire des commentaires publics.',
            BLOCKLIST: 'Lire votre liste de blocage.',
            BLOCKLIST_WRITE: 'Ajouter et supprimer des utilisateurs de votre liste de blocage.'
        }
    };
})(OAuthScopes || (exports.OAuthScopes = OAuthScopes = {}));
var Blacklist;
(function (Blacklist) {
    let FLAGS;
    (function (FLAGS) {
        FLAGS[FLAGS["NONE"] = 0] = "NONE";
        FLAGS[FLAGS["SHOUTS"] = 1] = "SHOUTS";
        FLAGS[FLAGS["COMMISSIONS"] = 2] = "COMMISSIONS";
        FLAGS[FLAGS["BANNED"] = 4] = "BANNED";
    })(FLAGS = Blacklist.FLAGS || (Blacklist.FLAGS = {}));
})(Blacklist || (exports.Blacklist = Blacklist = {}));
//# sourceMappingURL=db-utils.js.map