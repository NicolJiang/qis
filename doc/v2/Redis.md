QIS v2.0 Switch Memcached to Redis
==================================

Current status: pending

### Versions - Redis v3.0+ preferred

* RHEL 6.5 has Redis v2.4.10 in EPEL
* Latency monitoring added in v2.8.13
* LRU in 2.4 subject to large latency spikes, fixed in 2.8 and late 2.6
* LRU unbounded memory bug fixed in 2.6.15 / 2.8
* LRU algorithm improved again in 3.0

### Config - LRU mode, memory limit

* http://redis.io/topics/lru-cache
* redis.conf - maxmemory 100mb, allkeys-lru policy (nope! see below)
* Redis 3.0 preferred over 2.8 for LRU algorithm
* 5 samples probably OK in 3.0, can test 10 (see cache misses stats)
* redis.conf - maxmemory-samples 5
32 / 64 bit
* 32 bit version is limited to 4GB RAM
* use multiple instances in preference to the database number
* relax the fsync setting

Probably 2 instances:

* 1 for LRU cache with images, memory limited
* 1 for data store, persistent, unlimited (no, some limit + LRU)
* But complicated to administer, code for (2 connections), and cluster

Or 1 instance:

* Set long TTL / expiry on images
* Reset the TTL when image is retrieved (combine these 2 into 1 call?)
* Do NOT set an expiry on the data items
* Use memory limit with volatile-lru policy, evicts only items with TTL set

### Redis client

* redis-py

Things to note:

* Is the Redis client thread safe?
* Look at http://redis.io/topics/admin for things like Linux kernel params

### QIS uses of the cache (not including cache_manager itself)

* clear all (for unit tests)
  * beware if using 2 instances/databases
* detection of up/down status
* detection of % full (when memory limit in force)
* global lock - db creation (atomic add)
* global lock - image generation (atomic add)
* get/set image src --> image ID
* get/set image key --> binary image object     } combine into single hash?
* get/set image metadata key --> metadata dict  } maybe not, docs say hash values are strings
* cache search for base images
  * ID + format + (width>=x || none) + (height>=y || none)
  * ordered by size (no need?), limited to 100 (no need if can pull back metadata only)
  * 100 limit can go if we also consider that base cannot be a tile (check this assumption)
    and filter it redis-side
* cache search for image variants
  * ID
  * no result limit
* time limited flag - pyramid generation complete (10 min timeout)
* get/set user+folder --> calculated permissions tuple, 3600 sec expiry
* unit tests
  * slot mechanism tests can be deleted
  * hash collision / integrity check tests can be deleted

### Memcached quirks that can be deleted

* Cache tracking table in Postgres, Python model and SQLAlchemy code
* Cache tracking database and Postgres user
  * Update install documentation, tuning documentation
  * Remove from Dockerfiles, Docker init scripts
  * Remove from AWS AMIs, AWS init scripts
  * Reduce Postgres max connections (maybe)
  * Remove from base_settings and local_settings
* Multiple slots mechanism
* Self integrity checks

### Things to test

* Redis client thread safety
* Does the Redis client re-connect automatically after Redis re-start?

### Redis quirks

* If we enable persistence, fsync can be off, snapshots required but how long will
  a 40GB DB take to write out? Is snapshot writing a lightweight task?
* Large DBs (several GB+) will take many minutes to load on startup,
  during which time Redis is unavailable
* We would therefore need a separate DB (persistence disabled) for startup lock flags
  * Maybe a temporary image store while the main DB is starting up?
* Or, we just disable persistence
