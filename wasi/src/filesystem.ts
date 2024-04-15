/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as $wcm from '@vscode/wasm-component-model';
import type { u64, u32, own, result, borrow, option, i32, i64, ptr } from '@vscode/wasm-component-model';
import { clocks } from './clocks';
import { io } from './io';

export namespace filesystem {
	/**
	 * WASI filesystem is a filesystem API primarily intended to let users run WASI
	 * programs that access their files on their existing filesystems, without
	 * significant overhead.
	 * 
	 * It is intended to be roughly portable between Unix-family platforms and
	 * Windows, though it does not hide many of the major differences.
	 * 
	 * Paths are passed as interface-type `string`s, meaning they must consist of
	 * a sequence of Unicode Scalar Values (USVs). Some filesystems may contain
	 * paths which are not accessible by this API.
	 * 
	 * The directory separator in WASI is always the forward-slash (`/`).
	 * 
	 * All paths in WASI are relative paths, and are interpreted relative to a
	 * `descriptor` referring to a base directory. If a `path` argument to any WASI
	 * function starts with `/`, or if any step of resolving a `path`, including
	 * `..` and symbolic link steps, reaches a directory outside of the base
	 * directory, or reaches a symlink to an absolute or rooted path in the
	 * underlying filesystem, the function fails with `error-code::not-permitted`.
	 * 
	 * For more information about WASI path resolution and sandboxing, see
	 * [WASI filesystem path resolution].
	 * 
	 * [WASI filesystem path resolution]: https://github.com/WebAssembly/wasi-filesystem/blob/main/path-resolution.md
	 */
	export namespace types {
		export type InputStream = io.streams.InputStream;

		export type OutputStream = io.streams.OutputStream;

		export type Error = io.streams.Error;

		export type Datetime = clocks.wallClock.Datetime;

		/**
		 * File size or length of a region within a file.
		 */
		export type Filesize = u64;


		/**
		 * The type of a filesystem object referenced by a descriptor.
		 * 
		 * Note: This was called `filetype` in earlier versions of WASI.
		 */
		export enum DescriptorType {

			/**
			 * The type of the descriptor or file is unknown or is different from
			 * any of the other types specified.
			 */
			unknown = 'unknown',

			/**
			 * The descriptor refers to a block device inode.
			 */
			blockDevice = 'blockDevice',

			/**
			 * The descriptor refers to a character device inode.
			 */
			characterDevice = 'characterDevice',

			/**
			 * The descriptor refers to a directory inode.
			 */
			directory = 'directory',

			/**
			 * The descriptor refers to a named pipe.
			 */
			fifo = 'fifo',

			/**
			 * The file refers to a symbolic link inode.
			 */
			symbolicLink = 'symbolicLink',

			/**
			 * The descriptor refers to a regular file inode.
			 */
			regularFile = 'regularFile',

			/**
			 * The descriptor refers to a socket.
			 */
			socket = 'socket'
		}


		/**
		 * Descriptor flags.
		 * 
		 * Note: This was called `fdflags` in earlier versions of WASI.
		 */
		export const DescriptorFlags = Object.freeze({

			/**
			 * Read mode: Data can be read.
			 */
			read: 1 << 0,

			/**
			 * Write mode: Data can be written to.
			 */
			write: 1 << 1,

			/**
			 * Request that writes be performed according to synchronized I/O file
			 * integrity completion. The data stored in the file and the file's
			 * metadata are synchronized. This is similar to `O_SYNC` in POSIX.
			 * 
			 * The precise semantics of this operation have not yet been defined for
			 * WASI. At this time, it should be interpreted as a request, and not a
			 * requirement.
			 */
			fileIntegritySync: 1 << 2,

			/**
			 * Request that writes be performed according to synchronized I/O data
			 * integrity completion. Only the data stored in the file is
			 * synchronized. This is similar to `O_DSYNC` in POSIX.
			 * 
			 * The precise semantics of this operation have not yet been defined for
			 * WASI. At this time, it should be interpreted as a request, and not a
			 * requirement.
			 */
			dataIntegritySync: 1 << 3,

			/**
			 * Requests that reads be performed at the same level of integrety
			 * requested for writes. This is similar to `O_RSYNC` in POSIX.
			 * 
			 * The precise semantics of this operation have not yet been defined for
			 * WASI. At this time, it should be interpreted as a request, and not a
			 * requirement.
			 */
			requestedWriteSync: 1 << 4,

			/**
			 * Mutating directories mode: Directory contents may be mutated.
			 * 
			 * When this flag is unset on a descriptor, operations using the
			 * descriptor which would create, rename, delete, modify the data or
			 * metadata of filesystem objects, or obtain another handle which
			 * would permit any of those, shall fail with `error-code::read-only` if
			 * they would otherwise succeed.
			 * 
			 * This may only be set on directories.
			 */
			mutateDirectory: 1 << 5,
		});
		export type DescriptorFlags = u32;


		/**
		 * Flags determining the method of how paths are resolved.
		 */
		export const PathFlags = Object.freeze({

			/**
			 * As long as the resolved path corresponds to a symbolic link, it is
			 * expanded.
			 */
			symlinkFollow: 1 << 0,
		});
		export type PathFlags = u32;


		/**
		 * Open flags used by `open-at`.
		 */
		export const OpenFlags = Object.freeze({

			/**
			 * Create file if it does not exist, similar to `O_CREAT` in POSIX.
			 */
			create: 1 << 0,

			/**
			 * Fail if not a directory, similar to `O_DIRECTORY` in POSIX.
			 */
			directory: 1 << 1,

			/**
			 * Fail if file already exists, similar to `O_EXCL` in POSIX.
			 */
			exclusive: 1 << 2,

			/**
			 * Truncate file to size 0, similar to `O_TRUNC` in POSIX.
			 */
			truncate: 1 << 3,
		});
		export type OpenFlags = u32;

		/**
		 * Number of hard links to an inode.
		 */
		export type LinkCount = u64;

		/**
		 * File attributes.
		 * 
		 * Note: This was called `filestat` in earlier versions of WASI.
		 */
		export type DescriptorStat = {

			/**
			 * File type.
			 */
			type: DescriptorType;

			/**
			 * Number of hard links to the file.
			 */
			linkCount: LinkCount;

			/**
			 * For regular files, the file size in bytes. For symbolic links, the
			 * length in bytes of the pathname contained in the symbolic link.
			 */
			size: Filesize;

			/**
			 * Last data access timestamp.
			 * 
			 * If the `option` is none, the platform doesn't maintain an access
			 * timestamp for this file.
			 */
			dataAccessTimestamp?: Datetime | undefined;

			/**
			 * Last data modification timestamp.
			 * 
			 * If the `option` is none, the platform doesn't maintain a
			 * modification timestamp for this file.
			 */
			dataModificationTimestamp?: Datetime | undefined;

			/**
			 * Last file status-change timestamp.
			 * 
			 * If the `option` is none, the platform doesn't maintain a
			 * status-change timestamp for this file.
			 */
			statusChangeTimestamp?: Datetime | undefined;
		};


		/**
		 * When setting a timestamp, this gives the value to set it to.
		 */
		export namespace NewTimestamp {

			/**
			 * Leave the timestamp set to its previous value.
			 */
			export const noChange = 'noChange' as const;
			export type NoChange = { readonly tag: typeof noChange } & _common;
			export function NoChange(): NoChange {
				return new VariantImpl(noChange, undefined) as NoChange;
			}


			/**
			 * Set the timestamp to the current time of the system clock associated
			 * with the filesystem.
			 */
			export const now = 'now' as const;
			export type Now = { readonly tag: typeof now } & _common;
			export function Now(): Now {
				return new VariantImpl(now, undefined) as Now;
			}


			/**
			 * Set the timestamp to the given value.
			 */
			export const timestamp = 'timestamp' as const;
			export type Timestamp = { readonly tag: typeof timestamp; readonly value: Datetime } & _common;
			export function Timestamp(value: Datetime): Timestamp {
				return new VariantImpl(timestamp, value) as Timestamp;
			}

			export type _tt = typeof noChange | typeof now | typeof timestamp;
			export type _vt = Datetime | undefined;
			type _common = Omit<VariantImpl, 'tag' | 'value'>;
			export function _ctor(t: _tt, v: _vt): NewTimestamp {
				return new VariantImpl(t, v) as NewTimestamp;
			}
			class VariantImpl {
				private readonly _tag: _tt;
				private readonly _value?: _vt;
				constructor(t: _tt, value: _vt) {
					this._tag = t;
					this._value = value;
				}
				get tag(): _tt {
					return this._tag;
				}
				get value(): _vt {
					return this._value;
				}
				isNoChange(): this is NoChange {
					return this._tag === NewTimestamp.noChange;
				}
				isNow(): this is Now {
					return this._tag === NewTimestamp.now;
				}
				isTimestamp(): this is Timestamp {
					return this._tag === NewTimestamp.timestamp;
				}
			}
		}
		export type NewTimestamp = NewTimestamp.NoChange | NewTimestamp.Now | NewTimestamp.Timestamp;

		/**
		 * A directory entry.
		 */
		export type DirectoryEntry = {

			/**
			 * The type of the file referred to by this directory entry.
			 */
			type: DescriptorType;

			/**
			 * The name of the object.
			 */
			name: string;
		};


		/**
		 * Error codes returned by functions, similar to `errno` in POSIX.
		 * Not all of these error codes are returned by the functions provided by this
		 * API; some are used in higher-level library layers, and others are provided
		 * merely for alignment with POSIX.
		 */
		export enum ErrorCode {

			/**
			 * Permission denied, similar to `EACCES` in POSIX.
			 */
			access = 'access',

			/**
			 * Resource unavailable, or operation would block, similar to `EAGAIN` and `EWOULDBLOCK` in POSIX.
			 */
			wouldBlock = 'wouldBlock',

			/**
			 * Connection already in progress, similar to `EALREADY` in POSIX.
			 */
			already = 'already',

			/**
			 * Bad descriptor, similar to `EBADF` in POSIX.
			 */
			badDescriptor = 'badDescriptor',

			/**
			 * Device or resource busy, similar to `EBUSY` in POSIX.
			 */
			busy = 'busy',

			/**
			 * Resource deadlock would occur, similar to `EDEADLK` in POSIX.
			 */
			deadlock = 'deadlock',

			/**
			 * Storage quota exceeded, similar to `EDQUOT` in POSIX.
			 */
			quota = 'quota',

			/**
			 * File exists, similar to `EEXIST` in POSIX.
			 */
			exist = 'exist',

			/**
			 * File too large, similar to `EFBIG` in POSIX.
			 */
			fileTooLarge = 'fileTooLarge',

			/**
			 * Illegal byte sequence, similar to `EILSEQ` in POSIX.
			 */
			illegalByteSequence = 'illegalByteSequence',

			/**
			 * Operation in progress, similar to `EINPROGRESS` in POSIX.
			 */
			inProgress = 'inProgress',

			/**
			 * Interrupted function, similar to `EINTR` in POSIX.
			 */
			interrupted = 'interrupted',

			/**
			 * Invalid argument, similar to `EINVAL` in POSIX.
			 */
			invalid = 'invalid',

			/**
			 * I/O error, similar to `EIO` in POSIX.
			 */
			io = 'io',

			/**
			 * Is a directory, similar to `EISDIR` in POSIX.
			 */
			isDirectory = 'isDirectory',

			/**
			 * Too many levels of symbolic links, similar to `ELOOP` in POSIX.
			 */
			loop = 'loop',

			/**
			 * Too many links, similar to `EMLINK` in POSIX.
			 */
			tooManyLinks = 'tooManyLinks',

			/**
			 * Message too large, similar to `EMSGSIZE` in POSIX.
			 */
			messageSize = 'messageSize',

			/**
			 * Filename too long, similar to `ENAMETOOLONG` in POSIX.
			 */
			nameTooLong = 'nameTooLong',

			/**
			 * No such device, similar to `ENODEV` in POSIX.
			 */
			noDevice = 'noDevice',

			/**
			 * No such file or directory, similar to `ENOENT` in POSIX.
			 */
			noEntry = 'noEntry',

			/**
			 * No locks available, similar to `ENOLCK` in POSIX.
			 */
			noLock = 'noLock',

			/**
			 * Not enough space, similar to `ENOMEM` in POSIX.
			 */
			insufficientMemory = 'insufficientMemory',

			/**
			 * No space left on device, similar to `ENOSPC` in POSIX.
			 */
			insufficientSpace = 'insufficientSpace',

			/**
			 * Not a directory or a symbolic link to a directory, similar to `ENOTDIR` in POSIX.
			 */
			notDirectory = 'notDirectory',

			/**
			 * Directory not empty, similar to `ENOTEMPTY` in POSIX.
			 */
			notEmpty = 'notEmpty',

			/**
			 * State not recoverable, similar to `ENOTRECOVERABLE` in POSIX.
			 */
			notRecoverable = 'notRecoverable',

			/**
			 * Not supported, similar to `ENOTSUP` and `ENOSYS` in POSIX.
			 */
			unsupported = 'unsupported',

			/**
			 * Inappropriate I/O control operation, similar to `ENOTTY` in POSIX.
			 */
			noTty = 'noTty',

			/**
			 * No such device or address, similar to `ENXIO` in POSIX.
			 */
			noSuchDevice = 'noSuchDevice',

			/**
			 * Value too large to be stored in data type, similar to `EOVERFLOW` in POSIX.
			 */
			overflow = 'overflow',

			/**
			 * Operation not permitted, similar to `EPERM` in POSIX.
			 */
			notPermitted = 'notPermitted',

			/**
			 * Broken pipe, similar to `EPIPE` in POSIX.
			 */
			pipe = 'pipe',

			/**
			 * Read-only file system, similar to `EROFS` in POSIX.
			 */
			readOnly = 'readOnly',

			/**
			 * Invalid seek, similar to `ESPIPE` in POSIX.
			 */
			invalidSeek = 'invalidSeek',

			/**
			 * Text file busy, similar to `ETXTBSY` in POSIX.
			 */
			textFileBusy = 'textFileBusy',

			/**
			 * Cross-device link, similar to `EXDEV` in POSIX.
			 */
			crossDevice = 'crossDevice'
		}


		/**
		 * File or memory access pattern advisory information.
		 */
		export enum Advice {

			/**
			 * The application has no advice to give on its behavior with respect
			 * to the specified data.
			 */
			normal = 'normal',

			/**
			 * The application expects to access the specified data sequentially
			 * from lower offsets to higher offsets.
			 */
			sequential = 'sequential',

			/**
			 * The application expects to access the specified data in a random
			 * order.
			 */
			random = 'random',

			/**
			 * The application expects to access the specified data in the near
			 * future.
			 */
			willNeed = 'willNeed',

			/**
			 * The application expects that it will not access the specified data
			 * in the near future.
			 */
			dontNeed = 'dontNeed',

			/**
			 * The application expects to access the specified data once and then
			 * not reuse it thereafter.
			 */
			noReuse = 'noReuse'
		}

		/**
		 * A 128-bit hash value, split into parts because wasm doesn't have a
		 * 128-bit integer type.
		 */
		export type MetadataHashValue = {

			/**
			 * 64 bits of a 128-bit hash value.
			 */
			lower: u64;

			/**
			 * Another 64 bits of a 128-bit hash value.
			 */
			upper: u64;
		};

		export namespace Descriptor {
			export interface Interface {
				$handle?: $wcm.ResourceHandle;
				$drop?(): void;

				/**
				 * Return a stream for reading from a file, if available.
				 * 
				 * May fail with an error-code describing why the file cannot be read.
				 * 
				 * Multiple read, write, and append streams may be active on the same open
				 * file and they do not interfere with each other.
				 * 
				 * Note: This allows using `read-stream`, which is similar to `read` in POSIX.
				 */
				readViaStream(offset: Filesize): result<own<InputStream>, ErrorCode>;

				/**
				 * Return a stream for writing to a file, if available.
				 * 
				 * May fail with an error-code describing why the file cannot be written.
				 * 
				 * Note: This allows using `write-stream`, which is similar to `write` in
				 * POSIX.
				 */
				writeViaStream(offset: Filesize): result<own<OutputStream>, ErrorCode>;

				/**
				 * Return a stream for appending to a file, if available.
				 * 
				 * May fail with an error-code describing why the file cannot be appended.
				 * 
				 * Note: This allows using `write-stream`, which is similar to `write` with
				 * `O_APPEND` in in POSIX.
				 */
				appendViaStream(): result<own<OutputStream>, ErrorCode>;

				/**
				 * Provide file advisory information on a descriptor.
				 * 
				 * This is similar to `posix_fadvise` in POSIX.
				 */
				advise(offset: Filesize, length: Filesize, advice: Advice): result<void, ErrorCode>;

				/**
				 * Synchronize the data of a file to disk.
				 * 
				 * This function succeeds with no effect if the file descriptor is not
				 * opened for writing.
				 * 
				 * Note: This is similar to `fdatasync` in POSIX.
				 */
				syncData(): result<void, ErrorCode>;

				/**
				 * Get flags associated with a descriptor.
				 * 
				 * Note: This returns similar flags to `fcntl(fd, F_GETFL)` in POSIX.
				 * 
				 * Note: This returns the value that was the `fs_flags` value returned
				 * from `fdstat_get` in earlier versions of WASI.
				 */
				getFlags(): result<DescriptorFlags, ErrorCode>;

				/**
				 * Get the dynamic type of a descriptor.
				 * 
				 * Note: This returns the same value as the `type` field of the `fd-stat`
				 * returned by `stat`, `stat-at` and similar.
				 * 
				 * Note: This returns similar flags to the `st_mode & S_IFMT` value provided
				 * by `fstat` in POSIX.
				 * 
				 * Note: This returns the value that was the `fs_filetype` value returned
				 * from `fdstat_get` in earlier versions of WASI.
				 */
				getType(): result<DescriptorType, ErrorCode>;

				/**
				 * Adjust the size of an open file. If this increases the file's size, the
				 * extra bytes are filled with zeros.
				 * 
				 * Note: This was called `fd_filestat_set_size` in earlier versions of WASI.
				 */
				setSize(size: Filesize): result<void, ErrorCode>;

				/**
				 * Adjust the timestamps of an open file or directory.
				 * 
				 * Note: This is similar to `futimens` in POSIX.
				 * 
				 * Note: This was called `fd_filestat_set_times` in earlier versions of WASI.
				 */
				setTimes(dataAccessTimestamp: NewTimestamp, dataModificationTimestamp: NewTimestamp): result<void, ErrorCode>;

				/**
				 * Read from a descriptor, without using and updating the descriptor's offset.
				 * 
				 * This function returns a list of bytes containing the data that was
				 * read, along with a bool which, when true, indicates that the end of the
				 * file was reached. The returned list will contain up to `length` bytes; it
				 * may return fewer than requested, if the end of the file is reached or
				 * if the I/O operation is interrupted.
				 * 
				 * In the future, this may change to return a `stream<u8, error-code>`.
				 * 
				 * Note: This is similar to `pread` in POSIX.
				 */
				read(length: Filesize, offset: Filesize): result<[Uint8Array, boolean], ErrorCode>;

				/**
				 * Write to a descriptor, without using and updating the descriptor's offset.
				 * 
				 * It is valid to write past the end of a file; the file is extended to the
				 * extent of the write, with bytes between the previous end and the start of
				 * the write set to zero.
				 * 
				 * In the future, this may change to take a `stream<u8, error-code>`.
				 * 
				 * Note: This is similar to `pwrite` in POSIX.
				 */
				write(buffer: Uint8Array, offset: Filesize): result<Filesize, ErrorCode>;

				/**
				 * Read directory entries from a directory.
				 * 
				 * On filesystems where directories contain entries referring to themselves
				 * and their parents, often named `.` and `..` respectively, these entries
				 * are omitted.
				 * 
				 * This always returns a new stream which starts at the beginning of the
				 * directory. Multiple streams may be active on the same directory, and they
				 * do not interfere with each other.
				 */
				readDirectory(): result<own<DirectoryEntryStream>, ErrorCode>;

				/**
				 * Synchronize the data and metadata of a file to disk.
				 * 
				 * This function succeeds with no effect if the file descriptor is not
				 * opened for writing.
				 * 
				 * Note: This is similar to `fsync` in POSIX.
				 */
				sync(): result<void, ErrorCode>;

				/**
				 * Create a directory.
				 * 
				 * Note: This is similar to `mkdirat` in POSIX.
				 */
				createDirectoryAt(path: string): result<void, ErrorCode>;

				/**
				 * Return the attributes of an open file or directory.
				 * 
				 * Note: This is similar to `fstat` in POSIX, except that it does not return
				 * device and inode information. For testing whether two descriptors refer to
				 * the same underlying filesystem object, use `is-same-object`. To obtain
				 * additional data that can be used do determine whether a file has been
				 * modified, use `metadata-hash`.
				 * 
				 * Note: This was called `fd_filestat_get` in earlier versions of WASI.
				 */
				stat(): result<DescriptorStat, ErrorCode>;

				/**
				 * Return the attributes of a file or directory.
				 * 
				 * Note: This is similar to `fstatat` in POSIX, except that it does not
				 * return device and inode information. See the `stat` description for a
				 * discussion of alternatives.
				 * 
				 * Note: This was called `path_filestat_get` in earlier versions of WASI.
				 */
				statAt(pathFlags: PathFlags, path: string): result<DescriptorStat, ErrorCode>;

				/**
				 * Adjust the timestamps of a file or directory.
				 * 
				 * Note: This is similar to `utimensat` in POSIX.
				 * 
				 * Note: This was called `path_filestat_set_times` in earlier versions of
				 * WASI.
				 */
				setTimesAt(pathFlags: PathFlags, path: string, dataAccessTimestamp: NewTimestamp, dataModificationTimestamp: NewTimestamp): result<void, ErrorCode>;

				/**
				 * Create a hard link.
				 * 
				 * Note: This is similar to `linkat` in POSIX.
				 */
				linkAt(oldPathFlags: PathFlags, oldPath: string, newDescriptor: borrow<Descriptor>, newPath: string): result<void, ErrorCode>;

				/**
				 * Open a file or directory.
				 * 
				 * The returned descriptor is not guaranteed to be the lowest-numbered
				 * descriptor not currently open/ it is randomized to prevent applications
				 * from depending on making assumptions about indexes, since this is
				 * error-prone in multi-threaded contexts. The returned descriptor is
				 * guaranteed to be less than 2**31.
				 * 
				 * If `flags` contains `descriptor-flags::mutate-directory`, and the base
				 * descriptor doesn't have `descriptor-flags::mutate-directory` set,
				 * `open-at` fails with `error-code::read-only`.
				 * 
				 * If `flags` contains `write` or `mutate-directory`, or `open-flags`
				 * contains `truncate` or `create`, and the base descriptor doesn't have
				 * `descriptor-flags::mutate-directory` set, `open-at` fails with
				 * `error-code::read-only`.
				 * 
				 * Note: This is similar to `openat` in POSIX.
				 */
				openAt(pathFlags: PathFlags, path: string, openFlags: OpenFlags, flags: DescriptorFlags): result<own<Descriptor>, ErrorCode>;

				/**
				 * Read the contents of a symbolic link.
				 * 
				 * If the contents contain an absolute or rooted path in the underlying
				 * filesystem, this function fails with `error-code::not-permitted`.
				 * 
				 * Note: This is similar to `readlinkat` in POSIX.
				 */
				readlinkAt(path: string): result<string, ErrorCode>;

				/**
				 * Remove a directory.
				 * 
				 * Return `error-code::not-empty` if the directory is not empty.
				 * 
				 * Note: This is similar to `unlinkat(fd, path, AT_REMOVEDIR)` in POSIX.
				 */
				removeDirectoryAt(path: string): result<void, ErrorCode>;

				/**
				 * Rename a filesystem object.
				 * 
				 * Note: This is similar to `renameat` in POSIX.
				 */
				renameAt(oldPath: string, newDescriptor: borrow<Descriptor>, newPath: string): result<void, ErrorCode>;

				/**
				 * Create a symbolic link (also known as a "symlink").
				 * 
				 * If `old-path` starts with `/`, the function fails with
				 * `error-code::not-permitted`.
				 * 
				 * Note: This is similar to `symlinkat` in POSIX.
				 */
				symlinkAt(oldPath: string, newPath: string): result<void, ErrorCode>;

				/**
				 * Unlink a filesystem object that is not a directory.
				 * 
				 * Return `error-code::is-directory` if the path refers to a directory.
				 * Note: This is similar to `unlinkat(fd, path, 0)` in POSIX.
				 */
				unlinkFileAt(path: string): result<void, ErrorCode>;

				/**
				 * Test whether two descriptors refer to the same filesystem object.
				 * 
				 * In POSIX, this corresponds to testing whether the two descriptors have the
				 * same device (`st_dev`) and inode (`st_ino` or `d_ino`) numbers.
				 * wasi-filesystem does not expose device and inode numbers, so this function
				 * may be used instead.
				 */
				isSameObject(other: borrow<Descriptor>): boolean;

				/**
				 * Return a hash of the metadata associated with a filesystem object referred
				 * to by a descriptor.
				 * 
				 * This returns a hash of the last-modification timestamp and file size, and
				 * may also include the inode number, device number, birth timestamp, and
				 * other metadata fields that may change when the file is modified or
				 * replaced. It may also include a secret value chosen by the
				 * implementation and not otherwise exposed.
				 * 
				 * Implementations are encourated to provide the following properties:
				 * 
				 * - If the file is not modified or replaced, the computed hash value should
				 * usually not change.
				 * - If the object is modified or replaced, the computed hash value should
				 * usually change.
				 * - The inputs to the hash should not be easily computable from the
				 * computed hash.
				 * 
				 * However, none of these is required.
				 */
				metadataHash(): result<MetadataHashValue, ErrorCode>;

				/**
				 * Return a hash of the metadata associated with a filesystem object referred
				 * to by a directory descriptor and a relative path.
				 * 
				 * This performs the same hash computation as `metadata-hash`.
				 */
				metadataHashAt(pathFlags: PathFlags, path: string): result<MetadataHashValue, ErrorCode>;
			}
			export type Statics = {
			};
			export type Class = Statics & {
			};
		}
		export type Descriptor = Descriptor.Interface;

		export namespace DirectoryEntryStream {
			export interface Interface {
				$handle?: $wcm.ResourceHandle;
				$drop?(): void;

				/**
				 * Read a single directory entry from a `directory-entry-stream`.
				 */
				readDirectoryEntry(): result<DirectoryEntry | undefined, ErrorCode>;
			}
			export type Statics = {
			};
			export type Class = Statics & {
			};
		}
		export type DirectoryEntryStream = DirectoryEntryStream.Interface;

		/**
		 * Attempts to extract a filesystem-related `error-code` from the stream
		 * `error` provided.
		 * 
		 * Stream operations which return `stream-error::last-operation-failed`
		 * have a payload with more information about the operation that failed.
		 * This payload can be passed through to this function to see if there's
		 * filesystem-related information about the error to return.
		 * 
		 * Note that this function is fallible because not all stream-related
		 * errors are filesystem-related errors.
		 */
		export type filesystemErrorCode = (err: borrow<Error>) => ErrorCode | undefined;
	}
	export type Types = {
		Descriptor: types.Descriptor.Class;
		DirectoryEntryStream: types.DirectoryEntryStream.Class;
		filesystemErrorCode: types.filesystemErrorCode;
	};

	export namespace preopens {
		export type Descriptor = filesystem.types.Descriptor;

		/**
		 * Return the set of preopened directories, and their path.
		 */
		export type getDirectories = () => [own<Descriptor>, string][];
	}
	export type Preopens = {
		getDirectories: preopens.getDirectories;
	};
}

export namespace filesystem {
	export namespace types.$ {
		export const InputStream = io.streams.$.InputStream;
		export const OutputStream = io.streams.$.OutputStream;
		export const Error = io.streams.$.Error;
		export const Datetime = clocks.wallClock.$.Datetime;
		export const Filesize = $wcm.u64;
		export const DescriptorType = new $wcm.EnumType<filesystem.types.DescriptorType>(['unknown', 'blockDevice', 'characterDevice', 'directory', 'fifo', 'symbolicLink', 'regularFile', 'socket']);
		export const DescriptorFlags = new $wcm.FlagsType<filesystem.types.DescriptorFlags>(6);
		export const PathFlags = new $wcm.FlagsType<filesystem.types.PathFlags>(1);
		export const OpenFlags = new $wcm.FlagsType<filesystem.types.OpenFlags>(4);
		export const LinkCount = $wcm.u64;
		export const DescriptorStat = new $wcm.RecordType<filesystem.types.DescriptorStat>([
			['type', DescriptorType],
			['linkCount', LinkCount],
			['size', Filesize],
			['dataAccessTimestamp', new $wcm.OptionType<filesystem.types.Datetime>(Datetime)],
			['dataModificationTimestamp', new $wcm.OptionType<filesystem.types.Datetime>(Datetime)],
			['statusChangeTimestamp', new $wcm.OptionType<filesystem.types.Datetime>(Datetime)],
		]);
		export const NewTimestamp = new $wcm.VariantType<filesystem.types.NewTimestamp, filesystem.types.NewTimestamp._tt, filesystem.types.NewTimestamp._vt>([['noChange', undefined], ['now', undefined], ['timestamp', Datetime]], filesystem.types.NewTimestamp._ctor);
		export const DirectoryEntry = new $wcm.RecordType<filesystem.types.DirectoryEntry>([
			['type', DescriptorType],
			['name', $wcm.wstring],
		]);
		export const ErrorCode = new $wcm.EnumType<filesystem.types.ErrorCode>(['access', 'wouldBlock', 'already', 'badDescriptor', 'busy', 'deadlock', 'quota', 'exist', 'fileTooLarge', 'illegalByteSequence', 'inProgress', 'interrupted', 'invalid', 'io', 'isDirectory', 'loop', 'tooManyLinks', 'messageSize', 'nameTooLong', 'noDevice', 'noEntry', 'noLock', 'insufficientMemory', 'insufficientSpace', 'notDirectory', 'notEmpty', 'notRecoverable', 'unsupported', 'noTty', 'noSuchDevice', 'overflow', 'notPermitted', 'pipe', 'readOnly', 'invalidSeek', 'textFileBusy', 'crossDevice']);
		export const Advice = new $wcm.EnumType<filesystem.types.Advice>(['normal', 'sequential', 'random', 'willNeed', 'dontNeed', 'noReuse']);
		export const MetadataHashValue = new $wcm.RecordType<filesystem.types.MetadataHashValue>([
			['lower', $wcm.u64],
			['upper', $wcm.u64],
		]);
		export const Descriptor = new $wcm.ResourceType<filesystem.types.Descriptor>('descriptor', 'wasi:filesystem/types/descriptor');
		export const Descriptor_Handle = new $wcm.ResourceHandleType('descriptor');
		export const DirectoryEntryStream = new $wcm.ResourceType<filesystem.types.DirectoryEntryStream>('directory-entry-stream', 'wasi:filesystem/types/directory-entry-stream');
		export const DirectoryEntryStream_Handle = new $wcm.ResourceHandleType('directory-entry-stream');
		Descriptor.addDestructor('$drop', new $wcm.DestructorType('[resource-drop]descriptor', [['inst', Descriptor]]));
		Descriptor.addMethod('readViaStream', new $wcm.MethodType<filesystem.types.Descriptor.Interface['readViaStream']>('[method]descriptor.read-via-stream', [
			['offset', Filesize],
		], new $wcm.ResultType<own<filesystem.types.InputStream>, filesystem.types.ErrorCode>(new $wcm.OwnType<filesystem.types.InputStream>(InputStream), ErrorCode)));
		Descriptor.addMethod('writeViaStream', new $wcm.MethodType<filesystem.types.Descriptor.Interface['writeViaStream']>('[method]descriptor.write-via-stream', [
			['offset', Filesize],
		], new $wcm.ResultType<own<filesystem.types.OutputStream>, filesystem.types.ErrorCode>(new $wcm.OwnType<filesystem.types.OutputStream>(OutputStream), ErrorCode)));
		Descriptor.addMethod('appendViaStream', new $wcm.MethodType<filesystem.types.Descriptor.Interface['appendViaStream']>('[method]descriptor.append-via-stream', [], new $wcm.ResultType<own<filesystem.types.OutputStream>, filesystem.types.ErrorCode>(new $wcm.OwnType<filesystem.types.OutputStream>(OutputStream), ErrorCode)));
		Descriptor.addMethod('advise', new $wcm.MethodType<filesystem.types.Descriptor.Interface['advise']>('[method]descriptor.advise', [
			['offset', Filesize],
			['length', Filesize],
			['advice', Advice],
		], new $wcm.ResultType<void, filesystem.types.ErrorCode>(undefined, ErrorCode)));
		Descriptor.addMethod('syncData', new $wcm.MethodType<filesystem.types.Descriptor.Interface['syncData']>('[method]descriptor.sync-data', [], new $wcm.ResultType<void, filesystem.types.ErrorCode>(undefined, ErrorCode)));
		Descriptor.addMethod('getFlags', new $wcm.MethodType<filesystem.types.Descriptor.Interface['getFlags']>('[method]descriptor.get-flags', [], new $wcm.ResultType<filesystem.types.DescriptorFlags, filesystem.types.ErrorCode>(DescriptorFlags, ErrorCode)));
		Descriptor.addMethod('getType', new $wcm.MethodType<filesystem.types.Descriptor.Interface['getType']>('[method]descriptor.get-type', [], new $wcm.ResultType<filesystem.types.DescriptorType, filesystem.types.ErrorCode>(DescriptorType, ErrorCode)));
		Descriptor.addMethod('setSize', new $wcm.MethodType<filesystem.types.Descriptor.Interface['setSize']>('[method]descriptor.set-size', [
			['size', Filesize],
		], new $wcm.ResultType<void, filesystem.types.ErrorCode>(undefined, ErrorCode)));
		Descriptor.addMethod('setTimes', new $wcm.MethodType<filesystem.types.Descriptor.Interface['setTimes']>('[method]descriptor.set-times', [
			['dataAccessTimestamp', NewTimestamp],
			['dataModificationTimestamp', NewTimestamp],
		], new $wcm.ResultType<void, filesystem.types.ErrorCode>(undefined, ErrorCode)));
		Descriptor.addMethod('read', new $wcm.MethodType<filesystem.types.Descriptor.Interface['read']>('[method]descriptor.read', [
			['length', Filesize],
			['offset', Filesize],
		], new $wcm.ResultType<[Uint8Array, boolean], filesystem.types.ErrorCode>(new $wcm.TupleType<[Uint8Array, boolean]>([new $wcm.Uint8ArrayType(), $wcm.bool]), ErrorCode)));
		Descriptor.addMethod('write', new $wcm.MethodType<filesystem.types.Descriptor.Interface['write']>('[method]descriptor.write', [
			['buffer', new $wcm.Uint8ArrayType()],
			['offset', Filesize],
		], new $wcm.ResultType<filesystem.types.Filesize, filesystem.types.ErrorCode>(Filesize, ErrorCode)));
		Descriptor.addMethod('readDirectory', new $wcm.MethodType<filesystem.types.Descriptor.Interface['readDirectory']>('[method]descriptor.read-directory', [], new $wcm.ResultType<own<filesystem.types.DirectoryEntryStream>, filesystem.types.ErrorCode>(new $wcm.OwnType<filesystem.types.DirectoryEntryStream>(DirectoryEntryStream), ErrorCode)));
		Descriptor.addMethod('sync', new $wcm.MethodType<filesystem.types.Descriptor.Interface['sync']>('[method]descriptor.sync', [], new $wcm.ResultType<void, filesystem.types.ErrorCode>(undefined, ErrorCode)));
		Descriptor.addMethod('createDirectoryAt', new $wcm.MethodType<filesystem.types.Descriptor.Interface['createDirectoryAt']>('[method]descriptor.create-directory-at', [
			['path', $wcm.wstring],
		], new $wcm.ResultType<void, filesystem.types.ErrorCode>(undefined, ErrorCode)));
		Descriptor.addMethod('stat', new $wcm.MethodType<filesystem.types.Descriptor.Interface['stat']>('[method]descriptor.stat', [], new $wcm.ResultType<filesystem.types.DescriptorStat, filesystem.types.ErrorCode>(DescriptorStat, ErrorCode)));
		Descriptor.addMethod('statAt', new $wcm.MethodType<filesystem.types.Descriptor.Interface['statAt']>('[method]descriptor.stat-at', [
			['pathFlags', PathFlags],
			['path', $wcm.wstring],
		], new $wcm.ResultType<filesystem.types.DescriptorStat, filesystem.types.ErrorCode>(DescriptorStat, ErrorCode)));
		Descriptor.addMethod('setTimesAt', new $wcm.MethodType<filesystem.types.Descriptor.Interface['setTimesAt']>('[method]descriptor.set-times-at', [
			['pathFlags', PathFlags],
			['path', $wcm.wstring],
			['dataAccessTimestamp', NewTimestamp],
			['dataModificationTimestamp', NewTimestamp],
		], new $wcm.ResultType<void, filesystem.types.ErrorCode>(undefined, ErrorCode)));
		Descriptor.addMethod('linkAt', new $wcm.MethodType<filesystem.types.Descriptor.Interface['linkAt']>('[method]descriptor.link-at', [
			['oldPathFlags', PathFlags],
			['oldPath', $wcm.wstring],
			['newDescriptor', new $wcm.BorrowType<filesystem.types.Descriptor>(Descriptor)],
			['newPath', $wcm.wstring],
		], new $wcm.ResultType<void, filesystem.types.ErrorCode>(undefined, ErrorCode)));
		Descriptor.addMethod('openAt', new $wcm.MethodType<filesystem.types.Descriptor.Interface['openAt']>('[method]descriptor.open-at', [
			['pathFlags', PathFlags],
			['path', $wcm.wstring],
			['openFlags', OpenFlags],
			['flags', DescriptorFlags],
		], new $wcm.ResultType<own<filesystem.types.Descriptor>, filesystem.types.ErrorCode>(new $wcm.OwnType<filesystem.types.Descriptor>(Descriptor), ErrorCode)));
		Descriptor.addMethod('readlinkAt', new $wcm.MethodType<filesystem.types.Descriptor.Interface['readlinkAt']>('[method]descriptor.readlink-at', [
			['path', $wcm.wstring],
		], new $wcm.ResultType<string, filesystem.types.ErrorCode>($wcm.wstring, ErrorCode)));
		Descriptor.addMethod('removeDirectoryAt', new $wcm.MethodType<filesystem.types.Descriptor.Interface['removeDirectoryAt']>('[method]descriptor.remove-directory-at', [
			['path', $wcm.wstring],
		], new $wcm.ResultType<void, filesystem.types.ErrorCode>(undefined, ErrorCode)));
		Descriptor.addMethod('renameAt', new $wcm.MethodType<filesystem.types.Descriptor.Interface['renameAt']>('[method]descriptor.rename-at', [
			['oldPath', $wcm.wstring],
			['newDescriptor', new $wcm.BorrowType<filesystem.types.Descriptor>(Descriptor)],
			['newPath', $wcm.wstring],
		], new $wcm.ResultType<void, filesystem.types.ErrorCode>(undefined, ErrorCode)));
		Descriptor.addMethod('symlinkAt', new $wcm.MethodType<filesystem.types.Descriptor.Interface['symlinkAt']>('[method]descriptor.symlink-at', [
			['oldPath', $wcm.wstring],
			['newPath', $wcm.wstring],
		], new $wcm.ResultType<void, filesystem.types.ErrorCode>(undefined, ErrorCode)));
		Descriptor.addMethod('unlinkFileAt', new $wcm.MethodType<filesystem.types.Descriptor.Interface['unlinkFileAt']>('[method]descriptor.unlink-file-at', [
			['path', $wcm.wstring],
		], new $wcm.ResultType<void, filesystem.types.ErrorCode>(undefined, ErrorCode)));
		Descriptor.addMethod('isSameObject', new $wcm.MethodType<filesystem.types.Descriptor.Interface['isSameObject']>('[method]descriptor.is-same-object', [
			['other', new $wcm.BorrowType<filesystem.types.Descriptor>(Descriptor)],
		], $wcm.bool));
		Descriptor.addMethod('metadataHash', new $wcm.MethodType<filesystem.types.Descriptor.Interface['metadataHash']>('[method]descriptor.metadata-hash', [], new $wcm.ResultType<filesystem.types.MetadataHashValue, filesystem.types.ErrorCode>(MetadataHashValue, ErrorCode)));
		Descriptor.addMethod('metadataHashAt', new $wcm.MethodType<filesystem.types.Descriptor.Interface['metadataHashAt']>('[method]descriptor.metadata-hash-at', [
			['pathFlags', PathFlags],
			['path', $wcm.wstring],
		], new $wcm.ResultType<filesystem.types.MetadataHashValue, filesystem.types.ErrorCode>(MetadataHashValue, ErrorCode)));
		DirectoryEntryStream.addDestructor('$drop', new $wcm.DestructorType('[resource-drop]directory-entry-stream', [['inst', DirectoryEntryStream]]));
		DirectoryEntryStream.addMethod('readDirectoryEntry', new $wcm.MethodType<filesystem.types.DirectoryEntryStream.Interface['readDirectoryEntry']>('[method]directory-entry-stream.read-directory-entry', [], new $wcm.ResultType<option<filesystem.types.DirectoryEntry>, filesystem.types.ErrorCode>(new $wcm.OptionType<filesystem.types.DirectoryEntry>(DirectoryEntry), ErrorCode)));
		export const filesystemErrorCode = new $wcm.FunctionType<filesystem.types.filesystemErrorCode>('filesystem-error-code',[
			['err', new $wcm.BorrowType<filesystem.types.Error>(Error)],
		], new $wcm.OptionType<filesystem.types.ErrorCode>(ErrorCode));
	}
	export namespace types._ {
		export const id = 'wasi:filesystem/types@0.2.0' as const;
		export const witName = 'types' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['InputStream', $.InputStream],
			['OutputStream', $.OutputStream],
			['Error', $.Error],
			['Datetime', $.Datetime],
			['Filesize', $.Filesize],
			['DescriptorType', $.DescriptorType],
			['DescriptorFlags', $.DescriptorFlags],
			['PathFlags', $.PathFlags],
			['OpenFlags', $.OpenFlags],
			['LinkCount', $.LinkCount],
			['DescriptorStat', $.DescriptorStat],
			['NewTimestamp', $.NewTimestamp],
			['DirectoryEntry', $.DirectoryEntry],
			['ErrorCode', $.ErrorCode],
			['Advice', $.Advice],
			['MetadataHashValue', $.MetadataHashValue],
			['Descriptor', $.Descriptor],
			['DirectoryEntryStream', $.DirectoryEntryStream]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['filesystemErrorCode', $.filesystemErrorCode]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map<string, $wcm.ResourceType>([
			['Descriptor', $.Descriptor],
			['DirectoryEntryStream', $.DirectoryEntryStream]
		]);
		export namespace Descriptor {
			export type WasmInterface = {
				'[method]descriptor.read-via-stream': (self: i32, offset: i64, result: ptr<result<own<InputStream>, ErrorCode>>) => void;
				'[method]descriptor.write-via-stream': (self: i32, offset: i64, result: ptr<result<own<OutputStream>, ErrorCode>>) => void;
				'[method]descriptor.append-via-stream': (self: i32, result: ptr<result<own<OutputStream>, ErrorCode>>) => void;
				'[method]descriptor.advise': (self: i32, offset: i64, length: i64, advice_Advice: i32, result: ptr<result<void, ErrorCode>>) => void;
				'[method]descriptor.sync-data': (self: i32, result: ptr<result<void, ErrorCode>>) => void;
				'[method]descriptor.get-flags': (self: i32, result: ptr<result<DescriptorFlags, ErrorCode>>) => void;
				'[method]descriptor.get-type': (self: i32, result: ptr<result<DescriptorType, ErrorCode>>) => void;
				'[method]descriptor.set-size': (self: i32, size: i64, result: ptr<result<void, ErrorCode>>) => void;
				'[method]descriptor.set-times': (self: i32, dataAccessTimestamp_case: i32, dataAccessTimestamp_0: i64, dataAccessTimestamp_1: i32, dataModificationTimestamp_case: i32, dataModificationTimestamp_0: i64, dataModificationTimestamp_1: i32, result: ptr<result<void, ErrorCode>>) => void;
				'[method]descriptor.read': (self: i32, length: i64, offset: i64, result: ptr<result<[Uint8Array, boolean], ErrorCode>>) => void;
				'[method]descriptor.write': (self: i32, buffer_ptr: i32, buffer_len: i32, offset: i64, result: ptr<result<Filesize, ErrorCode>>) => void;
				'[method]descriptor.read-directory': (self: i32, result: ptr<result<own<DirectoryEntryStream>, ErrorCode>>) => void;
				'[method]descriptor.sync': (self: i32, result: ptr<result<void, ErrorCode>>) => void;
				'[method]descriptor.create-directory-at': (self: i32, path_ptr: i32, path_len: i32, result: ptr<result<void, ErrorCode>>) => void;
				'[method]descriptor.stat': (self: i32, result: ptr<result<DescriptorStat, ErrorCode>>) => void;
				'[method]descriptor.stat-at': (self: i32, pathFlags: i32, path_ptr: i32, path_len: i32, result: ptr<result<DescriptorStat, ErrorCode>>) => void;
				'[method]descriptor.set-times-at': (self: i32, pathFlags: i32, path_ptr: i32, path_len: i32, dataAccessTimestamp_case: i32, dataAccessTimestamp_0: i64, dataAccessTimestamp_1: i32, dataModificationTimestamp_case: i32, dataModificationTimestamp_0: i64, dataModificationTimestamp_1: i32, result: ptr<result<void, ErrorCode>>) => void;
				'[method]descriptor.link-at': (self: i32, oldPathFlags: i32, oldPath_ptr: i32, oldPath_len: i32, newDescriptor: i32, newPath_ptr: i32, newPath_len: i32, result: ptr<result<void, ErrorCode>>) => void;
				'[method]descriptor.open-at': (self: i32, pathFlags: i32, path_ptr: i32, path_len: i32, openFlags: i32, flags: i32, result: ptr<result<own<Descriptor>, ErrorCode>>) => void;
				'[method]descriptor.readlink-at': (self: i32, path_ptr: i32, path_len: i32, result: ptr<result<string, ErrorCode>>) => void;
				'[method]descriptor.remove-directory-at': (self: i32, path_ptr: i32, path_len: i32, result: ptr<result<void, ErrorCode>>) => void;
				'[method]descriptor.rename-at': (self: i32, oldPath_ptr: i32, oldPath_len: i32, newDescriptor: i32, newPath_ptr: i32, newPath_len: i32, result: ptr<result<void, ErrorCode>>) => void;
				'[method]descriptor.symlink-at': (self: i32, oldPath_ptr: i32, oldPath_len: i32, newPath_ptr: i32, newPath_len: i32, result: ptr<result<void, ErrorCode>>) => void;
				'[method]descriptor.unlink-file-at': (self: i32, path_ptr: i32, path_len: i32, result: ptr<result<void, ErrorCode>>) => void;
				'[method]descriptor.is-same-object': (self: i32, other: i32) => i32;
				'[method]descriptor.metadata-hash': (self: i32, result: ptr<result<MetadataHashValue, ErrorCode>>) => void;
				'[method]descriptor.metadata-hash-at': (self: i32, pathFlags: i32, path_ptr: i32, path_len: i32, result: ptr<result<MetadataHashValue, ErrorCode>>) => void;
				'[resource-drop]descriptor': (self: i32) => void;
			};
			type ObjectModule = {
				$drop(self: Descriptor): void;
				readViaStream(self: Descriptor, offset: Filesize): result<own<InputStream>, ErrorCode>;
				writeViaStream(self: Descriptor, offset: Filesize): result<own<OutputStream>, ErrorCode>;
				appendViaStream(self: Descriptor): result<own<OutputStream>, ErrorCode>;
				advise(self: Descriptor, offset: Filesize, length: Filesize, advice: Advice): result<void, ErrorCode>;
				syncData(self: Descriptor): result<void, ErrorCode>;
				getFlags(self: Descriptor): result<DescriptorFlags, ErrorCode>;
				getType(self: Descriptor): result<DescriptorType, ErrorCode>;
				setSize(self: Descriptor, size: Filesize): result<void, ErrorCode>;
				setTimes(self: Descriptor, dataAccessTimestamp: NewTimestamp, dataModificationTimestamp: NewTimestamp): result<void, ErrorCode>;
				read(self: Descriptor, length: Filesize, offset: Filesize): result<[Uint8Array, boolean], ErrorCode>;
				write(self: Descriptor, buffer: Uint8Array, offset: Filesize): result<Filesize, ErrorCode>;
				readDirectory(self: Descriptor): result<own<DirectoryEntryStream>, ErrorCode>;
				sync(self: Descriptor): result<void, ErrorCode>;
				createDirectoryAt(self: Descriptor, path: string): result<void, ErrorCode>;
				stat(self: Descriptor): result<DescriptorStat, ErrorCode>;
				statAt(self: Descriptor, pathFlags: PathFlags, path: string): result<DescriptorStat, ErrorCode>;
				setTimesAt(self: Descriptor, pathFlags: PathFlags, path: string, dataAccessTimestamp: NewTimestamp, dataModificationTimestamp: NewTimestamp): result<void, ErrorCode>;
				linkAt(self: Descriptor, oldPathFlags: PathFlags, oldPath: string, newDescriptor: borrow<Descriptor>, newPath: string): result<void, ErrorCode>;
				openAt(self: Descriptor, pathFlags: PathFlags, path: string, openFlags: OpenFlags, flags: DescriptorFlags): result<own<Descriptor>, ErrorCode>;
				readlinkAt(self: Descriptor, path: string): result<string, ErrorCode>;
				removeDirectoryAt(self: Descriptor, path: string): result<void, ErrorCode>;
				renameAt(self: Descriptor, oldPath: string, newDescriptor: borrow<Descriptor>, newPath: string): result<void, ErrorCode>;
				symlinkAt(self: Descriptor, oldPath: string, newPath: string): result<void, ErrorCode>;
				unlinkFileAt(self: Descriptor, path: string): result<void, ErrorCode>;
				isSameObject(self: Descriptor, other: borrow<Descriptor>): boolean;
				metadataHash(self: Descriptor): result<MetadataHashValue, ErrorCode>;
				metadataHashAt(self: Descriptor, pathFlags: PathFlags, path: string): result<MetadataHashValue, ErrorCode>;
			};
			class Impl extends $wcm.Resource implements filesystem.types.Descriptor.Interface {
				private readonly _om: ObjectModule;
				constructor(om: ObjectModule) {
					super();
					this._om = om;
				}
				public $drop(): void {
					return this._om.$drop(this);
				}
				public readViaStream(offset: Filesize): result<own<InputStream>, ErrorCode> {
					return this._om.readViaStream(this, offset);
				}
				public writeViaStream(offset: Filesize): result<own<OutputStream>, ErrorCode> {
					return this._om.writeViaStream(this, offset);
				}
				public appendViaStream(): result<own<OutputStream>, ErrorCode> {
					return this._om.appendViaStream(this);
				}
				public advise(offset: Filesize, length: Filesize, advice: Advice): result<void, ErrorCode> {
					return this._om.advise(this, offset, length, advice);
				}
				public syncData(): result<void, ErrorCode> {
					return this._om.syncData(this);
				}
				public getFlags(): result<DescriptorFlags, ErrorCode> {
					return this._om.getFlags(this);
				}
				public getType(): result<DescriptorType, ErrorCode> {
					return this._om.getType(this);
				}
				public setSize(size: Filesize): result<void, ErrorCode> {
					return this._om.setSize(this, size);
				}
				public setTimes(dataAccessTimestamp: NewTimestamp, dataModificationTimestamp: NewTimestamp): result<void, ErrorCode> {
					return this._om.setTimes(this, dataAccessTimestamp, dataModificationTimestamp);
				}
				public read(length: Filesize, offset: Filesize): result<[Uint8Array, boolean], ErrorCode> {
					return this._om.read(this, length, offset);
				}
				public write(buffer: Uint8Array, offset: Filesize): result<Filesize, ErrorCode> {
					return this._om.write(this, buffer, offset);
				}
				public readDirectory(): result<own<DirectoryEntryStream>, ErrorCode> {
					return this._om.readDirectory(this);
				}
				public sync(): result<void, ErrorCode> {
					return this._om.sync(this);
				}
				public createDirectoryAt(path: string): result<void, ErrorCode> {
					return this._om.createDirectoryAt(this, path);
				}
				public stat(): result<DescriptorStat, ErrorCode> {
					return this._om.stat(this);
				}
				public statAt(pathFlags: PathFlags, path: string): result<DescriptorStat, ErrorCode> {
					return this._om.statAt(this, pathFlags, path);
				}
				public setTimesAt(pathFlags: PathFlags, path: string, dataAccessTimestamp: NewTimestamp, dataModificationTimestamp: NewTimestamp): result<void, ErrorCode> {
					return this._om.setTimesAt(this, pathFlags, path, dataAccessTimestamp, dataModificationTimestamp);
				}
				public linkAt(oldPathFlags: PathFlags, oldPath: string, newDescriptor: borrow<Descriptor>, newPath: string): result<void, ErrorCode> {
					return this._om.linkAt(this, oldPathFlags, oldPath, newDescriptor, newPath);
				}
				public openAt(pathFlags: PathFlags, path: string, openFlags: OpenFlags, flags: DescriptorFlags): result<own<Descriptor>, ErrorCode> {
					return this._om.openAt(this, pathFlags, path, openFlags, flags);
				}
				public readlinkAt(path: string): result<string, ErrorCode> {
					return this._om.readlinkAt(this, path);
				}
				public removeDirectoryAt(path: string): result<void, ErrorCode> {
					return this._om.removeDirectoryAt(this, path);
				}
				public renameAt(oldPath: string, newDescriptor: borrow<Descriptor>, newPath: string): result<void, ErrorCode> {
					return this._om.renameAt(this, oldPath, newDescriptor, newPath);
				}
				public symlinkAt(oldPath: string, newPath: string): result<void, ErrorCode> {
					return this._om.symlinkAt(this, oldPath, newPath);
				}
				public unlinkFileAt(path: string): result<void, ErrorCode> {
					return this._om.unlinkFileAt(this, path);
				}
				public isSameObject(other: borrow<Descriptor>): boolean {
					return this._om.isSameObject(this, other);
				}
				public metadataHash(): result<MetadataHashValue, ErrorCode> {
					return this._om.metadataHash(this);
				}
				public metadataHashAt(pathFlags: PathFlags, path: string): result<MetadataHashValue, ErrorCode> {
					return this._om.metadataHashAt(this, pathFlags, path);
				}
			}
			export function Class(wasmInterface: WasmInterface, context: $wcm.WasmContext): filesystem.types.Descriptor.Class {
				const resource = filesystem.types.$.Descriptor;
				const om: ObjectModule = $wcm.Module.createObjectModule(resource, wasmInterface, context);
				return class extends Impl {
					constructor() {
						super(om);
					}
				};
			}
		}
		export namespace DirectoryEntryStream {
			export type WasmInterface = {
				'[method]directory-entry-stream.read-directory-entry': (self: i32, result: ptr<result<DirectoryEntry | undefined, ErrorCode>>) => void;
				'[resource-drop]directory-entry-stream': (self: i32) => void;
			};
			type ObjectModule = {
				$drop(self: DirectoryEntryStream): void;
				readDirectoryEntry(self: DirectoryEntryStream): result<DirectoryEntry | undefined, ErrorCode>;
			};
			class Impl extends $wcm.Resource implements filesystem.types.DirectoryEntryStream.Interface {
				private readonly _om: ObjectModule;
				constructor(om: ObjectModule) {
					super();
					this._om = om;
				}
				public $drop(): void {
					return this._om.$drop(this);
				}
				public readDirectoryEntry(): result<DirectoryEntry | undefined, ErrorCode> {
					return this._om.readDirectoryEntry(this);
				}
			}
			export function Class(wasmInterface: WasmInterface, context: $wcm.WasmContext): filesystem.types.DirectoryEntryStream.Class {
				const resource = filesystem.types.$.DirectoryEntryStream;
				const om: ObjectModule = $wcm.Module.createObjectModule(resource, wasmInterface, context);
				return class extends Impl {
					constructor() {
						super(om);
					}
				};
			}
		}
		export type WasmInterface = {
			'filesystem-error-code': (err: i32, result: ptr<ErrorCode | undefined>) => void;
		} & Descriptor.WasmInterface & DirectoryEntryStream.WasmInterface;
		export function createImports(service: filesystem.Types, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Imports.create<WasmInterface>(functions, resources, service, context);
		}
		export function filterExports(exports: object, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Exports.filter<WasmInterface>(exports, functions, resources, id, filesystem._.version, context);
		}
		export function bindExports(wasmInterface: WasmInterface, context: $wcm.WasmContext): filesystem.Types {
			return $wcm.Exports.bind<filesystem.Types>(functions, [['Descriptor', $.Descriptor, Descriptor.Class], ['DirectoryEntryStream', $.DirectoryEntryStream, DirectoryEntryStream.Class]], wasmInterface, context);
		}
	}

	export namespace preopens.$ {
		export const Descriptor = filesystem.types.$.Descriptor;
		export const getDirectories = new $wcm.FunctionType<filesystem.preopens.getDirectories>('get-directories', [], new $wcm.ListType<[own<filesystem.preopens.Descriptor>, string]>(new $wcm.TupleType<[own<filesystem.preopens.Descriptor>, string]>([new $wcm.OwnType<filesystem.preopens.Descriptor>(Descriptor), $wcm.wstring])));
	}
	export namespace preopens._ {
		export const id = 'wasi:filesystem/preopens@0.2.0' as const;
		export const witName = 'preopens' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['Descriptor', $.Descriptor]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['getDirectories', $.getDirectories]
		]);
		export type WasmInterface = {
			'get-directories': (result: ptr<[own<Descriptor>, string][]>) => void;
		};
		export function createImports(service: filesystem.Preopens, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Imports.create<WasmInterface>(functions, undefined, service, context);
		}
		export function filterExports(exports: object, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Exports.filter<WasmInterface>(exports, functions, undefined, id, filesystem._.version, context);
		}
		export function bindExports(wasmInterface: WasmInterface, context: $wcm.WasmContext): filesystem.Preopens {
			return $wcm.Exports.bind<filesystem.Preopens>(functions, [], wasmInterface, context);
		}
	}
}

export namespace filesystem._ {
	export const version = '0.2.0' as const;
	export const id = 'wasi:filesystem@0.2.0' as const;
	export const witName = 'filesystem' as const;
	export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
		['types', types._],
		['preopens', preopens._]
	]);
}