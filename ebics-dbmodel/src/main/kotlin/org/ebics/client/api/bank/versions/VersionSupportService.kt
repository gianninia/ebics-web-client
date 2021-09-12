package org.ebics.client.api.bank.versions

import org.ebics.client.api.bank.Bank
import org.springframework.stereotype.Service

@Service
class VersionSupportService(private val versionSupportRepository: VersionSupportRepository) {
    fun updateVersionSupport(versionSupport: VersionSupport): Long {
        return versionSupportRepository.save(versionSupport).id!!
    }

    fun updateVersionSupport(base: VersionSupportBase, bank: Bank): Long {
        return updateVersionSupport(VersionSupport.fromBaseAndBank(base, bank))
    }
}