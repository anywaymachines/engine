"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const path_1 = __importDefault(require("path"));
const typescript_1 = __importDefault(require("typescript"));
const create = (program, context) => {
    const factory = typescript_1.default.factory;
    const typeChecker = program.getTypeChecker();
    const identifierByTypeNode = (typeNode) => identifierByType(typeChecker.getTypeFromTypeNode(typeNode));
    const identifierByType = (type) => {
        const declaration = type.symbol?.valueDeclaration
            ?? type.aliasSymbol?.declarations?.[0]
            ?? type.symbol?.declarations?.[0]
            ?? type.aliasSymbol?.valueDeclaration;
        if (!declaration)
            return;
        const pth = path_1.default.relative("src", declaration.getSourceFile().fileName).replaceAll("\\", "/");
        return pth + "$" + (type.aliasSymbol?.name ?? type.symbol.name);
    };
    /** Fix namespace function hoisting by moving any variable and inside namespace declarations to the bottom */
    const transformNamespaces = (file) => {
        const fixNamespace = (node) => {
            if ((node.flags & typescript_1.default.NodeFlags.Namespace) === 0 || !node.body || !typescript_1.default.isModuleBlock(node.body))
                return node;
            const functionDeclarations = [];
            const anyDeclarations = [];
            for (const child of node.body.statements) {
                if (typescript_1.default.isFunctionDeclaration(child)) {
                    functionDeclarations.push(child);
                }
                else if (typescript_1.default.isModuleDeclaration(child)) {
                    anyDeclarations.push(fixNamespace(child));
                }
                else {
                    anyDeclarations.push(child);
                }
            }
            return typescript_1.default.factory.createModuleDeclaration(node.modifiers, node.name, typescript_1.default.factory.createModuleBlock([
                ...functionDeclarations,
                ...anyDeclarations,
            ]), node.flags);
        };
        return typescript_1.default.visitEachChild(file, node => {
            if (typescript_1.default.isModuleDeclaration(node)) {
                return fixNamespace(node);
            }
            return node;
        }, context);
    };
    const transformLogs = (file) => {
        let needsImport = false;
        const scopedBlocks = new Set();
        const constructLog = (expression, logType) => {
            needsImport = true;
            const spt = file.fileName.split('/');
            let fileName = spt[spt.length - 1];
            fileName = fileName.substring(0, fileName.length - '.ts'.length);
            return factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier('__logger'), factory.createIdentifier(`_${logType}`)), expression.typeArguments, [
                factory.createStringLiteral(`\t - ${fileName}:${file.getLineAndCharacterOfPosition(expression.getStart()).line}`),
                ...expression.arguments,
            ]);
        };
        const constructScope = (expression) => {
            needsImport = true;
            let parent = expression.parent;
            while (parent && !typescript_1.default.isBlock(parent) && !typescript_1.default.isSourceFile(parent)) {
                parent = parent.parent;
            }
            if (!parent)
                throw 'what';
            if (!typescript_1.default.isBlock(parent) && !typescript_1.default.isSourceFile(parent))
                throw 'what';
            scopedBlocks.add(parent);
            return factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier('__logger'), factory.createIdentifier(`beginScope`)), expression.typeArguments, expression.arguments);
        };
        const visit = (node) => {
            if (typescript_1.default.isCallExpression(node) && typescript_1.default.isIdentifier(node.expression)) {
                if (node.expression.text === "$trace") {
                    return constructLog(node, "trace");
                }
                if (node.expression.text === "$debug") {
                    return constructLog(node, "debug");
                }
                if (node.expression.text === "$log") {
                    return constructLog(node, "info");
                }
                if (node.expression.text === "$warn") {
                    return constructLog(node, "warn");
                }
                if (node.expression.text === "$err") {
                    return constructLog(node, "err");
                }
                if (node.expression.text === "$beginScope") {
                    return constructScope(node);
                }
            }
            return typescript_1.default.visitEachChild(node, visit, context);
        };
        const addTryCatch = (statements) => {
            statements = [...statements];
            return factory.createTryStatement(factory.createBlock(statements), undefined, factory.createBlock([
                factory.createExpressionStatement(factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier('__logger'), factory.createIdentifier(`endScope`)), undefined, undefined)),
            ]));
        };
        const addEndScopes = (node) => {
            if (typescript_1.default.isBlock(node) || typescript_1.default.isSourceFile(node)) {
                for (const child of node.statements) {
                    if (typescript_1.default.isExpressionStatement(child) && typescript_1.default.isCallExpression(child.expression) && typescript_1.default.isIdentifier(child.expression.expression) && child.expression.expression.text === '$beginScope') {
                        needsImport = true;
                        if (typescript_1.default.isBlock(node)) {
                            return addTryCatch(typescript_1.default.visitEachChild(node, addEndScopes, context).statements);
                        }
                        else if (typescript_1.default.isSourceFile(node)) {
                            if (true)
                                throw 'Logger scoping outside of blocks is not supported!';
                            return factory.updateSourceFile(node, [addTryCatch(typescript_1.default.visitEachChild(node, addEndScopes, context).statements)], node.isDeclarationFile, node.referencedFiles, node.typeReferenceDirectives, node.hasNoDefaultLib, node.libReferenceDirectives);
                        }
                    }
                }
            }
            return typescript_1.default.visitEachChild(node, addEndScopes, context);
        };
        file = addEndScopes(file);
        file = typescript_1.default.visitEachChild(file, visit, context);
        if (needsImport) {
            file = factory.updateSourceFile(file, [
                factory.createImportDeclaration(undefined, factory.createImportClause(false, undefined, factory.createNamedImports([
                    factory.createImportSpecifier(false, factory.createIdentifier("Logger"), factory.createIdentifier("__logger")),
                ])), factory.createStringLiteral("engine/shared/Logger")),
                ...file.statements,
            ], file.isDeclarationFile, file.referencedFiles, file.typeReferenceDirectives, file.hasNoDefaultLib, file.libReferenceDirectives);
        }
        return file;
    };
    const transformDI = (file) => {
        const modifyParameters = (clazz) => {
            if (!clazz.name)
                return clazz;
            const classParentOf = (clazz) => {
                const extend = clazz.heritageClauses?.find(c => c.token === typescript_1.default.SyntaxKind.ExtendsKeyword)?.types[0].expression;
                if (!extend)
                    return;
                const t = typeChecker.getSymbolAtLocation(extend)?.declarations?.[0];
                if (!t || !typescript_1.default.isClassDeclaration(t))
                    return;
                return t;
            };
            const isClassInjectable = (clazz) => {
                if (clazz.modifiers?.find(m => typescript_1.default.isDecorator(m) && typescript_1.default.isIdentifier(m.expression) && m.expression.text === 'injectable')) {
                    return true;
                }
                const parent = classParentOf(clazz);
                if (!parent)
                    return false;
                return isClassInjectable(parent);
            };
            if (!isClassInjectable(clazz)) {
                return clazz;
            }
            let ctorAdded = [];
            let propAdded = [];
            let classsymb = undefined;
            let constr = undefined;
            if (!clazz.modifiers?.find(m => m.kind === typescript_1.default.SyntaxKind.AbstractKeyword)) {
                const getCtor = (clazz) => {
                    const ctor = clazz.members.find(typescript_1.default.isConstructorDeclaration);
                    if (ctor)
                        return ctor;
                    const parent = classParentOf(clazz);
                    if (!parent)
                        return;
                    return getCtor(parent);
                };
                constr = getCtor(clazz);
                if (constr) {
                    for (const parameter of constr.parameters) {
                        if (!parameter.modifiers || parameter.modifiers.length === 0) {
                            if (ctorAdded && ctorAdded.length !== 0) {
                                throw 'Can not have @inject declarations before non-inject ones';
                            }
                            continue;
                        }
                        for (const decorator of parameter.modifiers) {
                            if (!typescript_1.default.isDecorator(decorator))
                                continue;
                            if (!typescript_1.default.isIdentifier(decorator.expression))
                                continue;
                            if (decorator.expression.text !== 'inject' && decorator.expression.text !== 'tryInject' && decorator.expression.text !== 'injectFunc')
                                continue;
                            if (!typescript_1.default.isIdentifier(parameter.name))
                                continue;
                            classsymb ??= program.getTypeChecker().getSymbolAtLocation(clazz.name);
                            if (!classsymb) {
                                throw `Could not find symbol for class ${clazz.name.text}`;
                            }
                            if (decorator.expression.text === 'inject' || decorator.expression.text === 'tryInject') {
                                if (!parameter.type || !typescript_1.default.isTypeReferenceNode(parameter.type))
                                    continue;
                                if (!typescript_1.default.isIdentifier(parameter.type.typeName))
                                    continue;
                                ctorAdded ??= [];
                                ctorAdded.push({
                                    name: parameter.name,
                                    type: parameter.type,
                                    nullable: decorator.expression.text === 'tryInject',
                                    isFunc: false,
                                });
                            }
                            else {
                                if (!parameter.type || !typescript_1.default.isFunctionTypeNode(parameter.type))
                                    continue;
                                ctorAdded ??= [];
                                ctorAdded.push({
                                    name: parameter.name,
                                    type: parameter.type.type,
                                    nullable: false, // decorator.expression.text === 'tryInject',
                                    isFunc: true,
                                });
                            }
                        }
                    }
                }
            }
            for (const node of clazz.members) {
                if (typescript_1.default.isPropertyDeclaration(node)) {
                    const parameter = node;
                    if (!parameter.modifiers)
                        continue;
                    for (const decorator of parameter.modifiers) {
                        if (!typescript_1.default.isDecorator(decorator))
                            continue;
                        if (!typescript_1.default.isIdentifier(decorator.expression))
                            continue;
                        if (decorator.expression.text !== 'inject' && decorator.expression.text !== 'tryInject' && decorator.expression.text !== 'injectFunc')
                            continue;
                        if (!typescript_1.default.isIdentifier(parameter.name))
                            continue;
                        if (!parameter.type || !typescript_1.default.isTypeReferenceNode(parameter.type))
                            continue;
                        if (!typescript_1.default.isIdentifier(parameter.type.typeName))
                            continue;
                        classsymb ??= program.getTypeChecker().getSymbolAtLocation(clazz.name);
                        if (!classsymb) {
                            throw `Could not find symbol for class ${clazz.name.text}`;
                        }
                        propAdded ??= [];
                        identifierByTypeNode(parameter.type);
                        propAdded.push({
                            name: parameter.name,
                            type: parameter.type,
                            nullable: decorator.expression.text === 'tryInject',
                            isFunc: decorator.expression.text === 'injectFunc',
                        });
                    }
                }
            }
            const methods = [];
            if (ctorAdded.length !== 0 && !ctorAdded.find(a => !identifierByTypeNode(a.type))) {
                const method = factory.createMethodDeclaration([factory.createToken(typescript_1.default.SyntaxKind.StaticKeyword)], undefined, factory.createIdentifier("_depsCreate"), undefined, undefined, [
                    ...(constr?.parameters.filter(p => !ctorAdded.find(a => a.name.text === p.name.text)) ?? [])
                        .map(p => typescript_1.default.factory.createParameterDeclaration(p.modifiers?.filter(m => m.kind !== typescript_1.default.SyntaxKind.PrivateKeyword && m.kind !== typescript_1.default.SyntaxKind.ReadonlyKeyword), p.dotDotDotToken, p.name, p.questionToken, p.type, p.initializer)),
                    factory.createParameterDeclaration(undefined, undefined, factory.createIdentifier("di"), undefined, factory.createTypeReferenceNode(factory.createIdentifier("DIContainer"), undefined), undefined),
                ], undefined, factory.createBlock([
                    factory.createReturnStatement(factory.createNewExpression(clazz.name, undefined, [
                        ...(constr?.parameters.filter(p => !ctorAdded.find(a => a.name.text === p.name.text)).map(p => p.name) ?? []),
                        ...ctorAdded.map(a => {
                            let resolve = factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier("di"), factory.createIdentifier(a.nullable ? "tryResolve" : "resolve")), [a.type], [factory.createStringLiteral(identifierByTypeNode(a.type))]);
                            if (a.isFunc) {
                                resolve = factory.createArrowFunction(undefined, undefined, [], undefined, undefined, resolve);
                            }
                            return resolve;
                        }),
                    ])),
                ], true));
                methods.push(method);
            }
            if (propAdded.length !== 0 && !propAdded.find(a => !identifierByTypeNode(a.type))) {
                const method = factory.createMethodDeclaration(undefined, undefined, factory.createIdentifier("_inject"), undefined, undefined, [
                    factory.createParameterDeclaration(undefined, undefined, factory.createIdentifier("di"), undefined, factory.createTypeReferenceNode(factory.createIdentifier("DIContainer"), undefined), undefined),
                ], undefined, factory.createBlock([
                    ...propAdded.map(p => {
                        return factory.createExpressionStatement(factory.createBinaryExpression(factory.createPropertyAccessExpression(factory.createAsExpression(factory.createThis(), factory.createKeywordTypeNode(typescript_1.default.SyntaxKind.AnyKeyword)), p.name), factory.createToken(typescript_1.default.SyntaxKind.EqualsToken), factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier("di"), factory.createIdentifier(p.nullable ? "tryResolve" : "resolve")), [p.type], [factory.createStringLiteral(identifierByTypeNode(p.type))])));
                    }),
                ], true));
                methods.push(method);
            }
            return typescript_1.default.factory.createClassDeclaration(clazz.modifiers?.filter(m => !(typescript_1.default.isDecorator(m) && typescript_1.default.isIdentifier(m.expression) && m.expression.text === 'injectable')), clazz.name, clazz.typeParameters, clazz.heritageClauses, [
                ...methods,
                ...clazz.members.map(m => {
                    if (typescript_1.default.isConstructorDeclaration(m)) {
                        return typescript_1.default.factory.createConstructorDeclaration(m.modifiers, m.parameters.map(p => typescript_1.default.factory.createParameterDeclaration(p.modifiers?.filter(m => !(typescript_1.default.isDecorator(m) && typescript_1.default.isIdentifier(m.expression) && (m.expression.text === 'inject' || m.expression.text === 'injectFunc' || m.expression.text === 'tryInject'))), p.dotDotDotToken, p.name, p.questionToken, p.type, p.initializer)), m.body);
                    }
                    if (typescript_1.default.isPropertyDeclaration(m)) {
                        return typescript_1.default.factory.createPropertyDeclaration(m.modifiers?.filter(m => !(typescript_1.default.isDecorator(m) && typescript_1.default.isIdentifier(m.expression) && (m.expression.text === 'inject' || m.expression.text === 'injectFunc' || m.expression.text === 'tryInject'))), m.name, m.questionToken ?? m.exclamationToken, m.type, m.initializer);
                    }
                    return m;
                }),
            ]);
        };
        const visit = (node) => {
            if (typescript_1.default.isClassDeclaration(node) && node.name) {
                node = modifyParameters(node);
            }
            return typescript_1.default.visitEachChild(node, visit, context);
        };
        return typescript_1.default.visitEachChild(file, visit, context);
    };
    const transformDIDecoratorPathOf = (file) => {
        const modifyParameters = (call) => {
            const methodType = typeChecker.getResolvedSignature(call);
            if (!methodType)
                return;
            const declaration = methodType.getDeclaration();
            if (!declaration)
                return;
            let paramIdx = -1;
            for (const parameter of declaration.parameters) {
                if (typescript_1.default.isIdentifier(parameter.name) && parameter.name.text === 'this')
                    continue;
                paramIdx++;
                const decorators = typescript_1.default.getDecorators(parameter);
                if (!decorators)
                    continue;
                for (const decorator of decorators) {
                    if (!typescript_1.default.isCallExpression(decorator.expression))
                        continue;
                    if (!typescript_1.default.isIdentifier(decorator.expression.expression))
                        continue;
                    if (decorator.expression.expression.text === 'pathOf') {
                        if (!declaration.typeParameters)
                            continue;
                        if (call.arguments.length > paramIdx)
                            continue;
                        const typeName = decorator.expression.arguments[0].text;
                        const typeArgumentIndex = declaration.typeParameters.findIndex(p => p.name.text === typeName);
                        if (typeArgumentIndex < 0)
                            continue;
                        let type;
                        if (call.typeArguments) {
                            const typeNode = call.typeArguments[typeArgumentIndex];
                            if (!typeNode)
                                continue;
                            type = typeChecker.getTypeFromTypeNode(typeNode);
                        }
                        else {
                            const typeParameter = methodType.getTypeParameterAtPosition(typeArgumentIndex);
                            type = typeParameter?.mapper?.target ?? typeParameter;
                        }
                        const path = identifierByType(type);
                        if (!path)
                            continue;
                        const args = [...call.arguments ?? []];
                        args[paramIdx] = typescript_1.default.factory.createStringLiteral(path);
                        call = typescript_1.default.factory.createCallExpression(call.expression, call.typeArguments, args);
                    }
                }
            }
            return call;
        };
        const visit = (node) => {
            if (typescript_1.default.isCallExpression(node)) {
                node = modifyParameters(node) ?? node;
            }
            return typescript_1.default.visitEachChild(node, visit, context);
        };
        return typescript_1.default.visitEachChild(file, visit, context);
    };
    return (file) => {
        file = transformNamespaces(file);
        file = transformLogs(file);
        file = transformDI(file);
        file = transformDIDecoratorPathOf(file);
        return file;
    };
};
function default_1(program) {
    return (context) => create(program, context);
}
