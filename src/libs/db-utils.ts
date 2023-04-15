import { LangObject } from "./lang";

export class UserRoles {
	bitmask: number;

	constructor(bitmask: number) { this.bitmask = bitmask; }

	/**
	 * Verifies if the user has the specified role
	 * @param role The role to check
	 * @returns True if the user has the role
	 */
	has(role: keyof typeof UserRoles.FLAGS): boolean {
		return (this.bitmask & UserRoles.FLAGS[role]) !== 0;
	}

	/**
	 * Sets a role for the user
	 * @param role The role to set
	 */
	set(role: keyof typeof UserRoles.FLAGS) {
		this.bitmask |= UserRoles.FLAGS[role];
	}

	/**
	 * Removes a role for the user
	 * @param role The role to remove
	 */
	unset(role: keyof typeof UserRoles.FLAGS): void {
		this.bitmask &= ~UserRoles.FLAGS[role];
	}

	/**
	 * Returns a string list of the roles the user has
	 * @returns The roles the user has
	 */
	*values(): IterableIterator<string> {
		for (const role in UserRoles.FLAGS) {
			if (role === 'ALL') continue;
			if (this.has(role as keyof typeof UserRoles.FLAGS)) yield role;
		}
	}

	/**
	 * Returns a string list of html badges for the roles the user has
	 */
	*badges(): IterableIterator<string> {
		for (const role of this.values()) {
			const roleName = UserRoles.FLAGS_NAMES[role];
			var badgeClass = 'badge';

			switch (role) {
				case 'OWNER': badgeClass += ' alex-skunk'; break;
				case 'DEVELOPER': badgeClass += ' pinky'; break;
				case 'ADMIN': badgeClass += ' success'; break;
				case 'STAFF': badgeClass += ' warning'; break;
				case 'VETERAN': badgeClass += ' orange'; break;
				case 'VERIFIED_USER': badgeClass += ' generic'; break;
				case 'VERIFIED_DEVELOPER': badgeClass += ' alert'; break;
				case 'BUG_HUNTER': badgeClass += ' blurple'; break;
			}

			yield `<span class="${badgeClass}"><div class="dot"></div>${roleName}</span>`;
		}
	}
}
export namespace UserRoles {
	export enum FLAGS {
		OWNER =              1 << 0,
		DEVELOPER =          1 << 1,
		ADMIN =              1 << 2,
		STAFF =              1 << 3,
		VETERAN =            1 << 4,
		VERIFIED_USER =      1 << 5,
		VERIFIED_DEVELOPER = 1 << 6,
		BUG_HUNTER =         1 << 7,
		ALL =                OWNER | DEVELOPER | ADMIN | STAFF | VETERAN | VERIFIED_USER | VERIFIED_DEVELOPER | BUG_HUNTER
	}

	export const FLAGS_NAMES = {
		OWNER:              'Owner',
		DEVELOPER:          'Developer',
		ADMIN:              'Admin',
		STAFF:              'Staff',
		VETERAN:            'Veteran',
		VERIFIED_USER:      'Verified User',
		VERIFIED_DEVELOPER: 'Verified Developer',
		BUG_HUNTER:         'Bug Hunter',
		ALL:                'All'
	}
}


export class OAuthScopes {
	bitmask: number;

	constructor(bitmask: number) { this.bitmask = bitmask; }

	/**
	 * Verifies if the scopes list has the specified scope
	 * @param role The role to check
	 * @returns True if the list has the scope
	 */
	has(role: keyof typeof OAuthScopes.FLAGS): boolean {
		return (this.bitmask & OAuthScopes.FLAGS[role]) !== 0;
	}

	/**
	 * Sets a scope to the scopes list
	 * @param role The scope to set
	 */
	set(role: keyof typeof OAuthScopes.FLAGS) {
		this.bitmask |= OAuthScopes.FLAGS[role];
	}

	/**
	 * Removes a scope from the scopes list
	 * @param role The scope to remove
	 */
	unset(role: keyof typeof OAuthScopes.FLAGS): void {
		this.bitmask &= ~OAuthScopes.FLAGS[role];
	}

	/**
	 * Returns a string list of the scopes list
	 * @returns The scopes list
	 */
	*values(): IterableIterator<string> {
		for (const role in OAuthScopes.FLAGS) {
			if (this.has(role as keyof typeof OAuthScopes.FLAGS))
				yield OAuthScopes.toFlagString(role as keyof typeof OAuthScopes.FLAGS);
		}
	}

	/**
	 * Returns a human readable string list of the scopes list explaining what each scope does
	 * @returns The scopes list
	 */
	*descriptions(): IterableIterator<string> {
		for (const role in OAuthScopes.FLAGS) {
			if (this.has(role as keyof typeof OAuthScopes.FLAGS))
				yield OAuthScopes.FLAGS_DESCRIPTIONS.en[role];
		}
	}

	static toFlagKey(flag: string): keyof typeof OAuthScopes.FLAGS {
		return flag.toUpperCase().replace(/\./g, '_') as keyof typeof OAuthScopes.FLAGS;
	}

	static toFlagString(flag: keyof typeof OAuthScopes.FLAGS): string {
		return flag.toLowerCase().replace(/\_/g, '.');
	}

	static toFlag(flag: string): number {
		return OAuthScopes.FLAGS[OAuthScopes.toFlagKey(flag)];
	}
}

export namespace OAuthScopes {
	export enum FLAGS {
		IDENTIFY = 1 << 0,
		EMAIL = 1 << 1,
		FOLLOWERS = 1 << 2,
		FOLLOWERS_WRITE = 1 << 3,
		SHOUTS = 1 << 4,
		SHOUTS_WRITE = 1 << 5,
		BLOCKLIST = 1 << 6,
		BLOCKLIST_WRITE = 1 << 7
	}


	export const FLAGS_DESCRIPTIONS: LangObject = {
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
	}
}


export namespace Blacklist {
	export enum FLAGS {
		NONE = 0,
		SHOUTS = 1 << 0,
		COMMISSIONS = 1 << 1,
		BANNED = 1 << 2
	}

	export interface Entry {
		_type: FLAGS,
		usrid: string,
		reason: string,
		ends_at: Date
	}
}
