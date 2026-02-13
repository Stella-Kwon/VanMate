import {FastifyRequest, FastifyReply} from 'fastify';
import {registerUserSchema} from '@schema/user.schema';
import {UserService} from '@services/user.service';

export class UserController{
    async registerUserHandler(req: FastifyRequest, reply: FastifyReply){
        const body = registerUserSchema.parse(req.body);
        const userService = new UserService(req.em);
        const user = await userService.registerUser(body);
        // user 객체에는 password 필드가 포함되어 있음 (해시된 비밀번호)

        const {password, ...userWithoutPassword} = user;
        // 구조 분해 할당으로 password를 제외한 나머지 필드만 추출
        // 예: {id, email, family_name, given_name, ...} (password 제외)

        reply.send(userWithoutPassword);
        // 비밀번호 없이 사용자 정보만 응답
            }
}
