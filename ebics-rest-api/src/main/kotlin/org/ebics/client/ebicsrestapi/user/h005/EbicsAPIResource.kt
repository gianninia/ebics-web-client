package org.ebics.client.ebicsrestapi.user.h005

import org.ebics.client.ebicsrestapi.user.UserIdPass
import org.ebics.client.ebicsrestapi.user.UserPass
import org.springframework.web.bind.annotation.*

@RestController("EbicsAPIResourceH005")
@RequestMapping("users/{userId}/H005")
@CrossOrigin(origins = ["http://localhost:8080"])
class EbicsAPIResource (private val ebicsAPI: EbicsAPI){
    @PostMapping("sendINI")
    fun sendINI(@PathVariable userId:Long, @RequestBody userPass: UserPass) = ebicsAPI.sendINI(UserIdPass(userId, userPass.password))

    @PostMapping("sendHIA")
    fun sendHIA(@PathVariable userId:Long, @RequestBody userPass: UserPass) = ebicsAPI.sendHIA(UserIdPass(userId, userPass.password))

    @PostMapping("sendHPB")
    fun sendHPB(@PathVariable userId:Long, @RequestBody userPass: UserPass) = ebicsAPI.sendHPB(UserIdPass(userId, userPass.password))
}