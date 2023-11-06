import { Base } from "./base";
import { Posts } from "./posts"
import { applyMixins } from "./utils";

class MagicPoint extends Base { }

interface MagicPoint extends Posts { }

applyMixins(MagicPoint, [Posts])

export default MagicPoint